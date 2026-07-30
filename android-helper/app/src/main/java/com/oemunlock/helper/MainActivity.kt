package com.oemunlock.helper

import android.content.pm.PackageManager
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.oemunlock.helper.databinding.ActivityMainBinding
import rikka.shizuku.Shizuku
import java.io.BufferedReader
import java.io.InputStreamReader
import java.lang.reflect.Method

/**
 * A small companion to the OEM_Unlock proxy toolkit's `npm start` wizard.
 * Uses Shizuku (ADB-shell-level privilege, no root required) to run the
 * exact `settings put global http_proxy ...` command the wizard otherwise
 * has you type by hand into Wi-Fi settings.
 *
 * Also offers a diagnostic-only check for whether this device would allow
 * a certificate to be trusted at the system level. It does NOT attempt to
 * actually install one — see commonissues.md and README.md for why that
 * needs root on a locked-bootloader device, which Shizuku alone does not
 * grant.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding

    private val permissionListener = Shizuku.OnRequestPermissionResultListener { _, grantResult ->
        runOnUiThread {
            updateShizukuStatus()
            if (grantResult != PackageManager.PERMISSION_GRANTED) {
                showResult("Shizuku permission was denied. Tap \"Request Shizuku Permission\" to try again.")
            }
        }
    }

    private val binderReceivedListener = Shizuku.OnBinderReceivedListener {
        runOnUiThread { updateShizukuStatus() }
    }

    private val binderDeadListener = Shizuku.OnBinderDeadListener {
        runOnUiThread { updateShizukuStatus() }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        Shizuku.addRequestPermissionResultListener(permissionListener)
        Shizuku.addBinderReceivedListenerSticky(binderReceivedListener)
        Shizuku.addBinderDeadListener(binderDeadListener)

        binding.requestPermissionButton.setOnClickListener { requestShizukuPermission() }
        binding.setProxyButton.setOnClickListener { onSetProxy() }
        binding.clearProxyButton.setOnClickListener { onClearProxy() }
        binding.runDiagnosticButton.setOnClickListener { onRunDiagnostic() }

        updateShizukuStatus()
    }

    override fun onDestroy() {
        Shizuku.removeRequestPermissionResultListener(permissionListener)
        Shizuku.removeBinderReceivedListener(binderReceivedListener)
        Shizuku.removeBinderDeadListener(binderDeadListener)
        super.onDestroy()
    }

    // --- Shizuku status -----------------------------------------------

    private fun updateShizukuStatus() {
        if (!Shizuku.pingBinder()) {
            binding.statusText.text = getString(R.string.shizuku_status_not_running)
            binding.requestPermissionButton.isEnabled = false
            return
        }

        binding.requestPermissionButton.isEnabled = true

        if (hasShizukuPermission()) {
            binding.statusText.text = getString(R.string.shizuku_status_ready)
        } else {
            binding.statusText.text = getString(R.string.shizuku_status_needs_permission)
        }
    }

    private fun hasShizukuPermission(): Boolean {
        return try {
            Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED
        } catch (e: Exception) {
            false
        }
    }

    private fun requestShizukuPermission() {
        if (!Shizuku.pingBinder()) {
            showResult("Shizuku isn't running. Open the Shizuku app, start the service, then come back.")
            return
        }
        if (hasShizukuPermission()) {
            updateShizukuStatus()
            return
        }
        Shizuku.requestPermission(SHIZUKU_PERMISSION_REQUEST_CODE)
    }

    // --- Proxy actions ---------------------------------------------------

    private fun onSetProxy() {
        val host = binding.proxyHostInput.text.toString().trim()
        val port = binding.proxyPortInput.text.toString().trim()

        if (host.isEmpty() || port.isEmpty()) {
            showResult("Enter both the computer's IP address and a port first.")
            return
        }

        runGuarded {
            val result = runShellCommand("settings put global http_proxy $host:$port")
            showResult("Set proxy to $host:$port\n$result")
        }
    }

    private fun onClearProxy() {
        runGuarded {
            val result = runShellCommand("settings put global http_proxy :0")
            showResult("Cleared device proxy.\n$result")
        }
    }

    // --- Diagnostic (read-only, does not install anything) --------------

    private fun onRunDiagnostic() {
        runGuarded {
            val id = runShellCommand("id")
            val writable = runShellCommand("test -w /system && echo WRITABLE || echo NOT_WRITABLE")

            val verdict = if (writable.contains("WRITABLE") && !writable.contains("NOT_WRITABLE")) {
                "System write access appears available. A system-trusted certificate " +
                    "may be possible here — see commonissues.md for the manual steps; " +
                    "this app does not attempt the install itself."
            } else {
                "No system write access (expected on a non-rooted, locked-bootloader " +
                    "device). A system-trusted certificate isn't possible here without " +
                    "root — this matches what commonissues.md describes."
            }

            showResult("$verdict\n\nid: $id\ntest -w /system: $writable")
        }
    }

    // --- Shell execution via Shizuku ------------------------------------

    /**
     * Runs a command with Shizuku's granted shell-level privilege and
     * returns combined stdout/stderr plus the exit code. Uses Shizuku's
     * documented reflective `newProcess` entry point (see the Shizuku-API
     * demo app / wiki "run a command" section) since this app only needs
     * to run one-off commands, not a full custom privileged service.
     *
     * If this fails to resolve against whatever Shizuku version you build
     * against, the error is caught and shown in-app rather than crashing —
     * check the current Shizuku-API docs for the up-to-date approach if so.
     */
    private fun runShellCommand(command: String): String {
        return try {
            val method: Method = Shizuku::class.java.getDeclaredMethod(
                "newProcess",
                Array<String>::class.java,
                Array<String>::class.java,
                String::class.java
            )
            method.isAccessible = true
            val process = method.invoke(
                null,
                arrayOf("sh", "-c", command),
                null,
                null
            ) as Process

            val output = BufferedReader(InputStreamReader(process.inputStream)).readText()
            val errorOutput = BufferedReader(InputStreamReader(process.errorStream)).readText()
            val exitCode = process.waitFor()

            buildString {
                append("exit code: $exitCode")
                if (output.isNotBlank()) append("\n$output".trimEnd())
                if (errorOutput.isNotBlank()) append("\n$errorOutput".trimEnd())
            }
        } catch (e: Exception) {
            "Failed to run command via Shizuku: ${e.message}"
        }
    }

    private fun runGuarded(block: () -> Unit) {
        if (!hasShizukuPermission()) {
            showResult("Grant Shizuku permission first.")
            return
        }
        block()
    }

    private fun showResult(text: String) {
        binding.resultText.text = text
    }

    companion object {
        private const val SHIZUKU_PERMISSION_REQUEST_CODE = 1001
    }
}
