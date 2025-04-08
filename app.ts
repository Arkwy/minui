import { App } from "astal/gtk3"
import style from "./style.scss"
import Bar from "./widget/bar"
import Background from "./widget/background"
// import TmpClients from "./widget/workspace_manager"

const monitors = App.get_monitors()

App.start({
    css: style,
    main() {
        monitors.map(Bar)
        Background(monitors[0])
    },
})
