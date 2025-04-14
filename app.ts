import { App } from "astal/gtk3"
import { monitorFile, Gio, } from "astal/file"
import { exec } from "astal/process"

import style from "./style.scss"
import Bar from "./widget/bar"
import Background from "./widget/background"
// import TmpClients from "./widget/workspace_manager"

monitorFile("./style.scss", (file, event) => {
    if (event == Gio.FileMonitorEvent.CHANGED) {
        exec("sass ./style.scss /tmp/style.css")
        App.apply_css("/tmp/style.css")
    }
})

const monitors = App.get_monitors()

App.start({
    css: style,
    main() {
        monitors.map(Bar)
        Background(monitors[monitors.length - 1])
    },
})
