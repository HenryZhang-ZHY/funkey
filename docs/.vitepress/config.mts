import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "funkey",
    description: "An interpreter written in TypeScript.",
    appearance: false,

    // https://vitepress.dev/reference/default-theme-config
    themeConfig: {
        socialLinks: [
            {icon: 'github', link: 'https://github.com/HenryZhang-ZHY/funkey'}
        ],
    }
})
