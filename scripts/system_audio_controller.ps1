param(
    [switch]$RecoverAudio
)

$ErrorActionPreference = 'Stop'

$coreAudioType = @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

namespace MegaFala.Audio
{
    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDeviceEnumerator
    {
        int NotImpl1();
        int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice device);
        int NotImpl2();
        int NotImpl3();
        int NotImpl4();
        int NotImpl5();
    }

    [Guid("D666063F-1587-4E43-81F1-B948E807363F")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDevice
    {
        int Activate(ref Guid iid, int clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object interfacePointer);
    }

    [Guid("BFA971F1-4D5E-40BB-935E-967039BFBEE4")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioSessionManager2
    {
        int GetAudioSessionControl(ref Guid audioSessionGuid, uint streamFlags, out IAudioSessionControl sessionControl);
        int GetSimpleAudioVolume(ref Guid audioSessionGuid, uint streamFlags, out ISimpleAudioVolume audioVolume);
        int GetSessionEnumerator(out IAudioSessionEnumerator sessionEnum);
        int RegisterSessionNotification(IntPtr sessionNotification);
        int UnregisterSessionNotification(IntPtr sessionNotification);
        int RegisterDuckNotification([MarshalAs(UnmanagedType.LPWStr)] string sessionId, IntPtr duckNotification);
        int UnregisterDuckNotification(IntPtr duckNotification);
    }

    [Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioSessionEnumerator
    {
        int GetCount(out int sessionCount);
        int GetSession(int sessionIndex, out IAudioSessionControl sessionControl);
    }

    [Guid("F4B1A599-7266-4319-A8CA-E70ACB11E8CD")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioSessionControl
    {
        int GetState(out int state);
        int GetDisplayName([MarshalAs(UnmanagedType.LPWStr)] out string displayName);
        int SetDisplayName([MarshalAs(UnmanagedType.LPWStr)] string displayName, ref Guid eventContext);
        int GetIconPath([MarshalAs(UnmanagedType.LPWStr)] out string iconPath);
        int SetIconPath([MarshalAs(UnmanagedType.LPWStr)] string iconPath, ref Guid eventContext);
        int GetGroupingParam(out Guid groupingId);
        int SetGroupingParam(ref Guid groupingId, ref Guid eventContext);
        int RegisterAudioSessionNotification(IntPtr client);
        int UnregisterAudioSessionNotification(IntPtr client);
    }

    [Guid("bfb7ff88-7239-4fc9-8fa2-07c950be9c6d")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioSessionControl2
    {
        int GetState(out int state);
        int GetDisplayName([MarshalAs(UnmanagedType.LPWStr)] out string displayName);
        int SetDisplayName([MarshalAs(UnmanagedType.LPWStr)] string displayName, ref Guid eventContext);
        int GetIconPath([MarshalAs(UnmanagedType.LPWStr)] out string iconPath);
        int SetIconPath([MarshalAs(UnmanagedType.LPWStr)] string iconPath, ref Guid eventContext);
        int GetGroupingParam(out Guid groupingId);
        int SetGroupingParam(ref Guid groupingId, ref Guid eventContext);
        int RegisterAudioSessionNotification(IntPtr client);
        int UnregisterAudioSessionNotification(IntPtr client);
        int GetSessionIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string sessionIdentifier);
        int GetSessionInstanceIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string sessionInstanceIdentifier);
        int GetProcessId(out uint processId);
        int IsSystemSoundsSession();
        int SetDuckingPreference([MarshalAs(UnmanagedType.Bool)] bool optOut);
    }

    [Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface ISimpleAudioVolume
    {
        int SetMasterVolume(float level, ref Guid eventContext);
        int GetMasterVolume(out float level);
        int SetMute([MarshalAs(UnmanagedType.Bool)] bool isMuted, ref Guid eventContext);
        int GetMute(out bool isMuted);
    }

    [Guid("5CDF2C82-841E-4546-9722-0CF74078229A")]
    [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioEndpointVolume
    {
        int RegisterControlChangeNotify(IntPtr notify);
        int UnregisterControlChangeNotify(IntPtr notify);
        int GetChannelCount(out uint channelCount);
        int SetMasterVolumeLevel(float levelDb, ref Guid eventContext);
        int SetMasterVolumeLevelScalar(float level, ref Guid eventContext);
        int GetMasterVolumeLevel(out float levelDb);
        int GetMasterVolumeLevelScalar(out float level);
        int SetChannelVolumeLevel(uint channelNumber, float levelDb, ref Guid eventContext);
        int SetChannelVolumeLevelScalar(uint channelNumber, float level, ref Guid eventContext);
        int GetChannelVolumeLevel(uint channelNumber, out float levelDb);
        int GetChannelVolumeLevelScalar(uint channelNumber, out float level);
        int SetMute([MarshalAs(UnmanagedType.Bool)] bool isMuted, ref Guid eventContext);
        int GetMute(out bool isMuted);
        int GetVolumeStepInfo(out uint step, out uint stepCount);
        int VolumeStepUp(ref Guid eventContext);
        int VolumeStepDown(ref Guid eventContext);
        int QueryHardwareSupport(out uint hardwareSupportMask);
        int GetVolumeRange(out float volumeMindB, out float volumeMaxdB, out float volumeIncrementdB);
    }

    [ComImport]
    [Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
    public class MMDeviceEnumeratorComObject
    {
    }

    public class AudioSessionSnapshot
    {
        public string InstanceId { get; set; }
        public float Volume { get; set; }
        public bool Muted { get; set; }
    }

    public static class SessionVolumeController
    {
        private const int ClsCtxAll = 23;

        private static IMMDevice GetDefaultDevice()
        {
            IMMDeviceEnumerator enumerator = null;
            IMMDevice device = null;

            try
            {
                enumerator = (IMMDeviceEnumerator)new MMDeviceEnumeratorComObject();
                Marshal.ThrowExceptionForHR(enumerator.GetDefaultAudioEndpoint(0, 1, out device));
                return device;
            }
            finally
            {
                ReleaseCom(enumerator);
            }
        }

        private static IAudioSessionManager2 GetSessionManager(IMMDevice device)
        {
            object manager;
            var iid = typeof(IAudioSessionManager2).GUID;
            Marshal.ThrowExceptionForHR(device.Activate(ref iid, ClsCtxAll, IntPtr.Zero, out manager));
            return (IAudioSessionManager2)manager;
        }

        public static List<AudioSessionSnapshot> DuckExcept(int[] excludedProcessIds, float duckVolume)
        {
            var excluded = new HashSet<int>(excludedProcessIds ?? new int[0]);
            var snapshots = new List<AudioSessionSnapshot>();
            IMMDevice device = null;
            IAudioSessionManager2 manager = null;
            IAudioSessionEnumerator enumerator = null;

            try
            {
                device = GetDefaultDevice();
                manager = GetSessionManager(device);
                Marshal.ThrowExceptionForHR(manager.GetSessionEnumerator(out enumerator));

                int count;
                Marshal.ThrowExceptionForHR(enumerator.GetCount(out count));

                for (var index = 0; index < count; index++)
                {
                    IAudioSessionControl control = null;
                    IAudioSessionControl2 control2 = null;
                    ISimpleAudioVolume volume = null;

                    try
                    {
                        Marshal.ThrowExceptionForHR(enumerator.GetSession(index, out control));
                        control2 = (IAudioSessionControl2)control;
                        volume = (ISimpleAudioVolume)control;

                        uint processIdRaw;
                        Marshal.ThrowExceptionForHR(control2.GetProcessId(out processIdRaw));
                        var processId = unchecked((int)processIdRaw);
                        if (excluded.Contains(processId))
                        {
                            continue;
                        }

                        string instanceId;
                        Marshal.ThrowExceptionForHR(control2.GetSessionInstanceIdentifier(out instanceId));
                        if (string.IsNullOrEmpty(instanceId))
                        {
                            instanceId = processId.ToString() + ":" + index.ToString();
                        }

                        float originalVolume;
                        bool originalMuted;
                        Marshal.ThrowExceptionForHR(volume.GetMasterVolume(out originalVolume));
                        Marshal.ThrowExceptionForHR(volume.GetMute(out originalMuted));

                        snapshots.Add(new AudioSessionSnapshot
                        {
                            InstanceId = instanceId,
                            Volume = originalVolume,
                            Muted = originalMuted,
                        });

                        var context = Guid.Empty;
                        Marshal.ThrowExceptionForHR(volume.SetMasterVolume(duckVolume, ref context));
                        if (originalMuted)
                        {
                            Marshal.ThrowExceptionForHR(volume.SetMute(true, ref context));
                        }
                        else
                        {
                            Marshal.ThrowExceptionForHR(volume.SetMute(false, ref context));
                        }
                    }
                    finally
                    {
                        ReleaseCom(volume);
                        ReleaseCom(control2);
                        ReleaseCom(control);
                    }
                }

                return snapshots;
            }
            finally
            {
                ReleaseCom(enumerator);
                ReleaseCom(manager);
                ReleaseCom(device);
            }
        }

        public static void Restore(List<AudioSessionSnapshot> snapshots)
        {
            if (snapshots == null || snapshots.Count == 0)
            {
                return;
            }

            var snapshotMap = new Dictionary<string, AudioSessionSnapshot>(StringComparer.OrdinalIgnoreCase);
            foreach (var snapshot in snapshots)
            {
                if (snapshot == null || string.IsNullOrEmpty(snapshot.InstanceId) || snapshotMap.ContainsKey(snapshot.InstanceId))
                {
                    continue;
                }

                snapshotMap[snapshot.InstanceId] = snapshot;
            }

            IMMDevice device = null;
            IAudioSessionManager2 manager = null;
            IAudioSessionEnumerator enumerator = null;

            try
            {
                device = GetDefaultDevice();
                manager = GetSessionManager(device);
                Marshal.ThrowExceptionForHR(manager.GetSessionEnumerator(out enumerator));

                int count;
                Marshal.ThrowExceptionForHR(enumerator.GetCount(out count));

                for (var index = 0; index < count; index++)
                {
                    IAudioSessionControl control = null;
                    IAudioSessionControl2 control2 = null;
                    ISimpleAudioVolume volume = null;

                    try
                    {
                        Marshal.ThrowExceptionForHR(enumerator.GetSession(index, out control));
                        control2 = (IAudioSessionControl2)control;
                        volume = (ISimpleAudioVolume)control;

                        string instanceId;
                        Marshal.ThrowExceptionForHR(control2.GetSessionInstanceIdentifier(out instanceId));
                        if (string.IsNullOrEmpty(instanceId))
                        {
                            continue;
                        }

                        AudioSessionSnapshot snapshot;
                        if (!snapshotMap.TryGetValue(instanceId, out snapshot))
                        {
                            continue;
                        }

                        var context = Guid.Empty;
                        Marshal.ThrowExceptionForHR(volume.SetMasterVolume(snapshot.Volume, ref context));
                        Marshal.ThrowExceptionForHR(volume.SetMute(snapshot.Muted, ref context));
                    }
                    finally
                    {
                        ReleaseCom(volume);
                        ReleaseCom(control2);
                        ReleaseCom(control);
                    }
                }
            }
            finally
            {
                ReleaseCom(enumerator);
                ReleaseCom(manager);
                ReleaseCom(device);
            }
        }

        public static int RecoverSilentSessions(float restoreVolume)
        {
            var recovered = 0;
            IMMDevice device = null;
            IAudioSessionManager2 manager = null;
            IAudioSessionEnumerator enumerator = null;

            try
            {
                device = GetDefaultDevice();
                manager = GetSessionManager(device);
                Marshal.ThrowExceptionForHR(manager.GetSessionEnumerator(out enumerator));

                int count;
                Marshal.ThrowExceptionForHR(enumerator.GetCount(out count));

                for (var index = 0; index < count; index++)
                {
                    IAudioSessionControl control = null;
                    ISimpleAudioVolume volume = null;

                    try
                    {
                        Marshal.ThrowExceptionForHR(enumerator.GetSession(index, out control));
                        volume = (ISimpleAudioVolume)control;

                        float currentVolume;
                        bool currentMuted;
                        Marshal.ThrowExceptionForHR(volume.GetMasterVolume(out currentVolume));
                        Marshal.ThrowExceptionForHR(volume.GetMute(out currentMuted));

                        if (currentVolume > 0.0001f)
                        {
                            continue;
                        }

                        var context = Guid.Empty;
                        Marshal.ThrowExceptionForHR(volume.SetMasterVolume(restoreVolume, ref context));
                        Marshal.ThrowExceptionForHR(volume.SetMute(false, ref context));
                        recovered++;
                    }
                    finally
                    {
                        ReleaseCom(volume);
                        ReleaseCom(control);
                    }
                }
            }
            finally
            {
                ReleaseCom(enumerator);
                ReleaseCom(manager);
                ReleaseCom(device);
            }

            return recovered;
        }

        public static void EnsureDefaultEndpointAudible(float minimumVolume)
        {
            IMMDevice device = null;
            IAudioEndpointVolume endpointVolume = null;

            try
            {
                device = GetDefaultDevice();
                object endpointObject;
                var iid = typeof(IAudioEndpointVolume).GUID;
                Marshal.ThrowExceptionForHR(device.Activate(ref iid, ClsCtxAll, IntPtr.Zero, out endpointObject));
                endpointVolume = (IAudioEndpointVolume)endpointObject;

                float currentVolume;
                Marshal.ThrowExceptionForHR(endpointVolume.GetMasterVolumeLevelScalar(out currentVolume));
                var context = Guid.Empty;
                Marshal.ThrowExceptionForHR(endpointVolume.SetMute(false, ref context));
                if (currentVolume <= 0.0001f)
                {
                    Marshal.ThrowExceptionForHR(endpointVolume.SetMasterVolumeLevelScalar(minimumVolume, ref context));
                }
            }
            finally
            {
                ReleaseCom(endpointVolume);
                ReleaseCom(device);
            }
        }

        private static void ReleaseCom(object value)
        {
            if (value != null && Marshal.IsComObject(value))
            {
                Marshal.ReleaseComObject(value);
            }
        }
    }
}
"@

if (-not ([System.Management.Automation.PSTypeName]'MegaFala.Audio.SessionVolumeController').Type) {
    Add-Type -TypeDefinition $coreAudioType -Language CSharp
}

$snapshotStatePath = Join-Path ([System.IO.Path]::GetTempPath()) 'MegaFala.audio-duck-state.json'

$state = @{
    CaptureActive = $false
    Running = $true
    ExcludedPids = @()
    DuckVolume = 0.0
    Snapshots = New-Object System.Collections.Generic.List[MegaFala.Audio.AudioSessionSnapshot]
}

function Emit-Event {
    param(
        [string]$Type,
        [hashtable]$Payload = @{}
    )

    [Console]::Out.WriteLine((@{
        type = $Type
        payload = $Payload
    } | ConvertTo-Json -Compress))
    [Console]::Out.Flush()
}

function Save-SnapshotState {
    param(
        [System.Collections.Generic.List[MegaFala.Audio.AudioSessionSnapshot]]$Snapshots
    )

    $payload = @($Snapshots | ForEach-Object {
        @{
            InstanceId = $_.InstanceId
            Volume = $_.Volume
            Muted = $_.Muted
        }
    })

    Set-Content -Path $snapshotStatePath -Value ($payload | ConvertTo-Json -Compress) -Encoding UTF8
}

function Load-SnapshotState {
    if (-not (Test-Path $snapshotStatePath)) {
        return @()
    }

    $raw = Get-Content -Path $snapshotStatePath -Raw
    if ([string]::IsNullOrWhiteSpace($raw)) {
        return @()
    }

    $items = @($raw | ConvertFrom-Json)
    return @($items | ForEach-Object {
        $snapshot = New-Object MegaFala.Audio.AudioSessionSnapshot
        $snapshot.InstanceId = [string]$_.InstanceId
        $snapshot.Volume = [float]$_.Volume
        $snapshot.Muted = [bool]$_.Muted
        $snapshot
    })
}

function Clear-SnapshotState {
    if (Test-Path $snapshotStatePath) {
        Remove-Item $snapshotStatePath -Force -ErrorAction SilentlyContinue
    }
}

function Restore-StaleSnapshotState {
    $snapshots = Load-SnapshotState
    if ($snapshots.Count -eq 0) {
        Clear-SnapshotState
        return $false
    }

    $typedSnapshots = New-Object System.Collections.Generic.List[MegaFala.Audio.AudioSessionSnapshot]
    foreach ($snapshot in $snapshots) {
        [void]$typedSnapshots.Add($snapshot)
    }

    [MegaFala.Audio.SessionVolumeController]::Restore($typedSnapshots)
    Clear-SnapshotState
    return $true
}

function Recover-AudioOutput {
    $restoredSnapshot = Restore-StaleSnapshotState
    $recoveredSessions = [MegaFala.Audio.SessionVolumeController]::RecoverSilentSessions([float]0.35)
    [MegaFala.Audio.SessionVolumeController]::EnsureDefaultEndpointAudible([float]0.35)

    return @{
        restored_snapshot = [bool]$restoredSnapshot
        recovered_sessions = [int]$recoveredSessions
    }
}

function Configure-Controller {
    param($Payload)

    if ($null -eq $Payload) {
        return
    }

    $excluded = @()
    if ($Payload.PSObject.Properties.Name -contains 'excluded_pids') {
        $excluded = @($Payload.excluded_pids | ForEach-Object { [int]$_ } | Where-Object { $_ -gt 0 })
    }

    $state.ExcludedPids = $excluded

    if ($Payload.PSObject.Properties.Name -contains 'duck_volume') {
        $volume = [double]$Payload.duck_volume
        if ($volume -lt 0) { $volume = 0 }
        if ($volume -gt 1) { $volume = 1 }
        $state.DuckVolume = [float]$volume
    }
}

function Start-CaptureDuck {
    if ($state.CaptureActive) {
        return
    }

    $snapshots = [MegaFala.Audio.SessionVolumeController]::DuckExcept($state.ExcludedPids, $state.DuckVolume)
    $state.Snapshots = New-Object System.Collections.Generic.List[MegaFala.Audio.AudioSessionSnapshot]
    foreach ($snapshot in $snapshots) {
        [void]$state.Snapshots.Add($snapshot)
    }
    Save-SnapshotState -Snapshots $state.Snapshots

    $state.CaptureActive = $true
}

function Stop-CaptureDuck {
    if (-not $state.CaptureActive) {
        if (Test-Path $snapshotStatePath) {
            Restore-StaleSnapshotState | Out-Null
        }
        return
    }

    [MegaFala.Audio.SessionVolumeController]::Restore($state.Snapshots)
    $state.Snapshots = New-Object System.Collections.Generic.List[MegaFala.Audio.AudioSessionSnapshot]
    $state.CaptureActive = $false
    Clear-SnapshotState
}

if ($RecoverAudio) {
    $result = Recover-AudioOutput
    Emit-Event -Type 'recovered' -Payload $result
    exit 0
}

Restore-StaleSnapshotState | Out-Null
Emit-Event -Type 'ready'

try {
    while ($state.Running) {
        $line = [Console]::In.ReadLine()
        if ($null -eq $line) {
            break
        }

        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        try {
            $command = $line | ConvertFrom-Json
        } catch {
            Emit-Event -Type 'error' -Payload @{ message = 'Comando JSON invalido recebido pelo controlador de audio.' }
            continue
        }

        switch ($command.type) {
            'configure' {
                Configure-Controller $command.payload
            }
            'capture-begin' {
                Start-CaptureDuck
            }
            'capture-end' {
                Stop-CaptureDuck
            }
            'shutdown' {
                Stop-CaptureDuck
                $state.Running = $false
            }
            default {
                Emit-Event -Type 'warning' -Payload @{ message = "Comando desconhecido: $($command.type)" }
            }
        }
    }
} catch {
    Emit-Event -Type 'error' -Payload @{ message = $_.Exception.Message }
    throw
} finally {
    Stop-CaptureDuck
}
