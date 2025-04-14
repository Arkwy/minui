import { App, Astal, Gtk, Gdk } from "astal/gtk3"
import { Variable, bind, exec, GLib, Gio } from "astal"
import Battery from "gi://AstalBattery"
import Network from "gi://AstalNetwork"
import Bluetooth from "gi://AstalBluetooth"
import Hyprland from "gi://AstalHyprland"


const Status = () => {
    const time = Variable<GLib.DateTime>(GLib.DateTime.new_now_local()).poll(
        1000,
        () => GLib.DateTime.new_now_local(),
    )

    const uptime = Variable<string>("").poll(
        1000,
        () => exec("awk '{printf \"%02d:%02d:%02d\\n\", $1/3600, ($1%3600)/60, $1%60}' /proc/uptime"),
    )

    const bat = Battery.get_default()

    const total_ram = Number(exec(["bash", "-c", "free -m | grep Mem | awk '{print ($2/1024)}'"])).toFixed(1)
    const ram = Variable<string>("ram unitialized").poll(
        1000,
        () => {
            const used = Number(exec(["bash", "-c", "free -m | grep Mem | awk '{print ($3/1024)}'"])).toFixed(1)
            return `${used} / ${total_ram} GiB`
        }
    )

    const cpu = Variable<string>("cpu unitialized").poll(
        1000,
        () => exec(["bash", "-c", "echo \"$(top -bn1 | awk '/Cpu\\(s\\):/ {print 100 - $8}' | xargs printf \"%.1f\") % ($(uptime | awk -F'load average: ' '{print $2}' | cut -d',' -f1) / $(nproc))\""])
    )


    const disks_command = `
        df -h --exclude-type=tmpfs --exclude-type=squashfs --exclude-type=devtmpfs --exclude-type=proc --exclude-type=efivarfs | awk '
        NR>1 {
            disk=$6;
            used=$3;
            total=$2;

            # Extract the numerical value and unit suffix
            used_val = substr(used, 1, length(used)-1);
            total_val = substr(total, 1, length(total)-1);
            used_unit = substr(used, length(used));
            total_unit = substr(total, length(total));

            # Convert used and total to bytes
            used_bytes = used_val * 1024 ^ (index("KMGTP", used_unit));
            total_bytes = total_val * 1024 ^ (index("KMGTP", total_unit));

            # Determine the appropriate unit for total size
            if (total_bytes >= 1024^4) {
                unit = "TiB";
                scale = 1024^4;
            } else if (total_bytes >= 1024^3) {
                unit = "GiB";
                scale = 1024^3;
            } else if (total_bytes >= 1024^2) {
                unit = "MiB";
                scale = 1024^2;
            } else if (total_bytes >= 1024) {
                unit = "KiB";
                scale = 1024;
            } else {
                unit = "B";
                scale = 1;
            }

            # Convert bytes back to the selected unit
            used_val = used_bytes / scale;
            total_val = total_bytes / scale;

            # Format the output strings with conditional precision
            if (used_val < 1) {
                formatted_used = sprintf("%5.3f", used_val);
            } else {
                formatted_used = sprintf("%5.1f", used_val);
            }

            if (total_val < 1) {
                formatted_total = sprintf("%-5.3f", total_val);
            } else {
                formatted_total = sprintf("%-5.1f", total_val);
            }

            printf "*%s / %s  %s   %s\\n", formatted_used, formatted_total, unit, disk;
        }'
    `;
    const disks = Variable<string>("disks unitialized").poll(
        30000,
        () => exec(["bash", "-c", disks_command]).replace(/\*/g, '')
    )

    const network = Network.get_default()

    const bluetooth = Bluetooth.get_default()

    const separator = () => {
        const s = Gtk.Separator.new(Gtk.Orientation.HORIZONTAL)
        s.set_visible(true)
        return s
    }

    return <box className="state" orientation={1}>

        <label className="state_title" label="System" xalign={0} />
        {separator()}
        <box className="state_cell">
            <label className="left" label="OS" xalign={0} />
            <label className="right" label={
                new TextDecoder()
                    .decode(GLib.file_get_contents('/etc/os-release')[1])
                    .match(/PRETTY_NAME="([^"]+)"/)?.[1] ?? 'Unknown'
            } xalign={0} />
        </box>
        <box className="state_cell">
            <label className="left" label="kernel" xalign={0} />
            <label className="right" label={exec("uname -r")} xalign={0} />
        </box>


        <label className="state_title" label="ID" xalign={0} />
        {separator()}
        <box className="state_cell">
            <label className="left" label="hostname" xalign={0} />
            <label className="right" label={exec("hostname")} xalign={0} />
        </box>
        <box className="state_cell">
            <label className="left" label="user" xalign={0} />
            <label className="right" label={exec("whoami")} xalign={0} />
        </box>

        <label className="state_title" label="Time" xalign={0} />
        {separator()}
        <box className="state_cell">
            <label className="left" label="date" xalign={0} />
            <label className="right" label={time().as(t => t.format("%F")!)} xalign={0} />
        </box>
        <box className="state_cell">
            <label className="left" label="time" xalign={0} />
            <label className="right" label={time().as(t => t.format("%T")!)} xalign={0} onDestroy={() => time.drop()} />
        </box>
        <box className="state_cell">
            <label className="left" label="uptime" xalign={0} />
            <label className="right" label={uptime()} xalign={0} onDestroy={() => uptime.drop()} />
        </box>

        <label className="state_title" label="State" xalign={0} />
        {separator()}
        <box className="state_cell">
            <label className="left" label="CPU" xalign={0} />
            <label className="right" label={cpu()} xalign={0} onDestroy={() => cpu.drop()} />
        </box>
        <box className="state_cell">
            <label className="left" label="RAM" xalign={0} />
            <label className="right" label={ram()} xalign={0} onDestroy={() => ram.drop()} />
        </box>
        <box className="state_cell">
            <label className="left" label="disks" xalign={0} yalign={0} />
            <label className="right" label={disks()} xalign={0} onDestroy={() => disks.drop()} />
        </box>

        <box className="state_cell">
            <label className="left" label="battery" xalign={0} />
            <box className="right">
                <label label={
                    bind(bat, "percentage").as(p => `${Math.floor(p * 100)} %`)
                } xalign={0} />
                <label label={bind(bat, "charging").as(c => c ? " charging" : "")} xalign={0} />
            </box>
        </box>

        <label className="state_title" label="Network" xalign={0} />
        {separator()}
        <box className="state_cell">
            <label className="left" label="internet" xalign={0} />
            <label className="right" label={bind(network, "primary").as(p => {
                if (p == Network.Primary.UNKNOWN) {
                    return "disconnected"
                } else if (p == Network.Primary.WIRED) {
                    return "wired"
                } else if (p == Network.Primary.WIFI) {
                    return "WIFI"
                } else {
                    return "issue"
                }
            })} xalign={0} />
        </box>
        <box className="state_cell">
            <label className="left" label="bluetooth" xalign={0} yalign={0} />
            <scrollable className="right" width-request={400} height-request={100}>
                <box orientation={1}>
                    <eventbox onClick={() => bluetooth.toggle()}>
                        <label label={bind(bluetooth, "is_powered").as(p => p ? "enabled" : "disabled")} xalign={0}/>
                    </eventbox>
                    {separator()}
                    {bind(bluetooth, "devices").as(bds =>
                        bds.map(bd => <eventbox onClick={() => bd.connected ? bd.disconnect_device((res) => { console.log(res); }) : bd.connect_device((res) => { console.log(res); })}>
                            <box>
                                <icon icon={`${bd.icon}-symbolic`} />
                                <label label="-" />
                                <icon icon={bind(bd, "connected").as(c => c ? "bluetooth-active-symbolic" : "bluetooth-disabled-symbolic")} />
                                <label label={`  ${bd.name}`} />
                            </box>
                        </eventbox>)
                    )}
                </box>
            </scrollable>
        </box>
    </box>
}


const RandImage = () => {

    const dir = Gio.File.new_for_path('/home/arkwy/home/coding_projects/minui/images/tarot/croped');
    const enumerator = dir.enumerate_children('standard::*', Gio.FileQueryInfoFlags.NONE, null);

    let fileInfo;
    const files = [];

    while ((fileInfo = enumerator.next_file(null)) !== null) {
        const file = enumerator.get_child(fileInfo);
        if (fileInfo.get_file_type() === Gio.FileType.REGULAR) {
            const path = file.get_path()
            if (path != undefined) {
                files.push(path);
            }
        }
    }
    return files[Math.floor(Math.random() * files.length)]
}



const Image = () => {
    const img = Gtk.Image.new_from_file(RandImage())
    img.set_visible(true)
    return img
}


export default function Background(monitor: Gdk.Monitor) {
    const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor

    const hypr = Hyprland.get_default()

    return <window
        className="background"
        gdkmonitor={monitor}
        exclusivity={Astal.Exclusivity.IGNORE}
        layer={Astal.Layer.BACKGROUND}
        anchor={TOP | BOTTOM | LEFT | RIGHT}
        application={App}>
        <box orientation={0} homogeneous>
            {/* left side = state */}
            <box orientation={0}>
                <box hexpand />
                <box orientation={1}>
                    <box vexpand />
                    {Status()}
                    <box vexpand />
                </box>
                <box hexpand />
            </box>

            {/* rigt side = tbd */}
            <box/>
            
        </box>
    </window>
}
