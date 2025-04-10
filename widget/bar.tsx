import { App, Astal, Gtk, Gdk } from "astal/gtk3"
import { Variable, GLib, bind } from "astal"
import Hyprland from "gi://AstalHyprland"
import { Status } from "./background"

const hypr = Hyprland.get_default()

const time = Variable<GLib.DateTime>(GLib.DateTime.new_now_local()).poll(
    1000,
    () => GLib.DateTime.new_now_local(),
)


function Workspaces(monitor_id: number) {

    return <box className="workspaces">
        {bind(hypr, "workspaces").as(wss => {
            wss = wss
                .filter(ws => !(ws.id >= -99 && ws.id <= -2) && (ws.get_monitor().id == monitor_id))

            // if (wss.length < 2) return <box hexpand/>;  
            return wss
                .sort((a, b) => a.id - b.id)
                .map(ws => (
                    <button
                        className="workspace"
                        hexpand
                        onClick={() => ws.focus()}
                    >
                        <box orientation={1}>
                            <box
                                className={bind(hypr, "focused_workspace").as(fw =>
                                    ws === fw ? "focused" : "unfocused")} />
                            <box/>
                        </box>
                    </button>
                ))
        })
        }
    </box>
}

export default function Bar(monitor: Gdk.Monitor, monitor_id: number) {
    const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

    return <window
        className="bar"
        gdkmonitor={monitor}
        exclusivity={Astal.Exclusivity.IGNORE}
        layer={Astal.Layer.TOP}
        anchor={TOP | LEFT | RIGHT}
        application={App}>
        <box>
            {Workspaces(monitor_id)}
        </box>
    </window>
}
