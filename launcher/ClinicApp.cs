// Windows launcher for the Clinic Appointment and Patient Management System.
//
// The system is a web application, so this small program opens the hosted
// application in its own window (Microsoft Edge or Google Chrome "app" mode,
// without the address bar), or in the default browser if neither is found.
// The address is fixed when the .exe is built: see build-exe.ps1.
using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Windows.Forms;

[assembly: AssemblyTitle("Clinic Appointment and Patient Management System")]
[assembly: AssemblyDescription("Opens the clinic web application")]
[assembly: AssemblyProduct("Clinic Appointment and Patient Management System")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

static class ClinicApp
{
    const string AppUrl = "__APP_URL__";

    [STAThread]
    static void Main()
    {
        string pf = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        string pf86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
        string local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);

        string[] browsers =
        {
            Path.Combine(pf86, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(pf, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(pf, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(pf86, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(local, @"Google\Chrome\Application\chrome.exe"),
        };

        foreach (string browser in browsers)
        {
            if (!File.Exists(browser)) continue;
            try
            {
                Process.Start(browser, "--app=\"" + AppUrl + "\" --window-size=1366,800");
                return;
            }
            catch (Exception)
            {
                // try the next browser
            }
        }

        try
        {
            Process.Start(AppUrl); // default browser
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                "Could not open the application.\n\nPlease open this address in a web browser:\n" + AppUrl + "\n\n" + ex.Message,
                "Clinic Appointment and Patient Management System",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information);
        }
    }
}
