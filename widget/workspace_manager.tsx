import { App, Astal, Gtk, Gdk } from "astal/gtk3"
import { Variable, GLib, bind } from "astal"
import { Hyprland, Monitor, Workspace, Client } from "gi://AstalHyprland"

const hypr = Hyprland.get_default()


const monitor_displayed_workpace = Array<Variable<Workspace>>()

hypr.monitors.for_each((m: Monitor) => monitor_displayed_workpace.push(Variable<Workspace>(hypr.focused_workspace)))

function Clients(workspace: Hyprland.Workspace) {
    return <box className="workspace_clitens">
               {bind(hypr, "clients").as(clients => {
                   return clients.filter(client => client.workspace === workspace)
                       .map(client => <label label={client.title}/>)
               })} 
           </box>
}

export default function TmpClients(monitor: Gdk.Monitor) {
    const { BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor

    return <window
        className="Bar"
        gdkmonitor={monitor}
        exclusivity={Astal.Exclusivity.IGNORE}
        layer={Astal.Layer.TOP}
        anchor={BOTTOM | LEFT | RIGHT}
        application={App}>
        <box>
            {bind(hypr, "focused_workspace").as(fw => Clients(fw))}
        </box>
    </window>
}
