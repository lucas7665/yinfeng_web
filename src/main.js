import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { 
  Button,
  Tab,
  Tabs,
  List,
  Cell,
  Tag,
  Tabbar,
  TabbarItem,
  Toast,
  Form,
  Field,
  CellGroup,
  NavBar
} from 'vant'
import 'vant/lib/index.css'

const app = createApp(App)

app.use(router)
app.use(Button)
app.use(Tab)
app.use(Tabs)
app.use(List)
app.use(Cell)
app.use(Tag)
app.use(Tabbar)
app.use(TabbarItem)
app.use(Toast)
app.use(Form)
app.use(Field)
app.use(CellGroup)
app.use(NavBar)

app.mount('#app')
