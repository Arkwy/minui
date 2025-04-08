import { App, Astal, Gtk, Gdk } from "astal/gtk3"
import { Binding, Variable, GLib, bind } from "astal"
import { Hyprland, Monitor, Workspace, Client } from "gi://AstalHyprland"

const hypr = Hyprland.get_default()


const monitor_displayed_workpace = new Map<Monitor, Binding<Workspace>>()

hypr.monitors.for_each((m: Monitor) => monitor_displayed_workpace.push(Variable<Workspace>(hypr.focused_workspace)))

