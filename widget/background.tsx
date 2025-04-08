import { App, Astal, Gtk, Gdk } from "astal/gtk3"
import { Variable, bind, exec, GLib } from "astal"
import Battery from "gi://AstalBattery"

const Status = () => {

    const g = Gtk.Grid.new()

    const h = 1
    const w = 3
    
    const mh = 1
    const mw = 1

    const time = Variable<GLib.DateTime>(GLib.DateTime.new_now_local()).poll(
        1000,
        () => GLib.DateTime.new_now_local(),
    )

    const uptime = Variable<string>("").poll(
        1000,
        () => exec("awk '{printf \"%02d:%02d:%02d\\n\", $1/3600, ($1%3600)/60, $1%60}' /proc/uptime"),
    )

    const bat = Battery.get_default()

    var rows = 0

    const add_info = (widget_left: Gtk.Widget, widget_right: Gtk.Widget, height: uint = 1) => {
        g.attach(widget_left, mw, mh + h * rows, w, h *  height)
        g.attach(widget_right, mw + w, mh + h * rows, w, h *  height)
        rows += height
    }

    const add_separator = (name: str) => {
        g.attach(<box />, mw, mh + h * rows, 2 * w, h)
        // g.attach(<label className="separator" label={name} xalign={0} />, mw, mh + h * (rows + 1), 2 * w, h)
        // g.attach(<box class_name="separator_line"/>, mw, mh + h * (rows + 2), 2 * w, h)
        g.attach(<box orientation={1} halign={0} >
                     <box vexpand />
                     <label label={name} xalign={0}/>   
                     <box className="separator" />
                 </box>, mw, mh + h * rows, 2 * w, 2*h)
        rows += 2
    } 
 

    g.set_row_homogeneous(true)
    g.set_column_homogeneous(true)
    g.set_visible(true)

    // g.attach(<label label="margins top left" />, 0, 0, mw, mh)
    g.attach(<box />, 0, 0, mw, mh)

    // hostname
    add_info(
        <label label="hostname" xalign={0} />,
        <label label={exec("hostname")} xalign={0}/>,
    )

    // user
    add_info(
        <label label="user" xalign={0} />,
        <label label={exec("whoami")} xalign={0}/>,
    )


    add_separator("Time")
    // date
    add_info(
        <label label="date" xalign={0} />,
        <label label={time().as(t => t.format("%F")!)} xalign={0} />,
    )

    // time
    add_info(
        <label label="time" xalign={0} />,
        <label label={time().as(t => t.format("%T")!)} xalign={0} onDestroy={() => time.drop()} />,
    )

    // uptime
    add_info(
        <label label="uptime" xalign={0} />,
        <label label={uptime()} xalign={0} onDestroy={() => uptime.drop()} />,
    )
    
    // os
    add_separator("System")
    add_info(
        <label label="OS" xalign={0} />,
        <label label={
            new TextDecoder()
                .decode(GLib.file_get_contents('/etc/os-release')[1])
                .match(/PRETTY_NAME="([^"]+)"/)?.[1] ?? 'Unknown'
        } xalign={0} />,
    )

    // kernel
    add_info(
        <label label="kernel" xalign={0} />,
        <label label={exec("uname -r")} xalign={0} />,
    )

    // battery
    add_separator("Power")
    add_info(
        <label label="battery" xalign={0} />,
        <label label={bind(bat, "percentage").as(p => `${Math.floor(p * 100)} %`)} xalign={0} />,
    )

    // g.attach(<label label="margin bottom" />, 0, mh + rows * h, mw + 2 * w, mh)
    g.attach(<box />, 0, mh + rows * h, mw + 2 * w, mh)

    return g
}

