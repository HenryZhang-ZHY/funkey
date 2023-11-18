import {defineLoader} from 'vitepress'
import {readFile} from 'node:fs/promises'
import {basename, parse} from 'node:path'

interface SampleData {
    chapter: string,
    name: string,
    code: string,
}

interface Sample {
    name: string,
    code: string,
}

interface Chapter {
    name: string
    samples: Sample[]
}

export interface Data {
    chapters: Chapter[]
}

declare const data: Data
export {data}

export default defineLoader({
    watch: ['./samples/**/*.fk'],
    async load(watchedFiles): Promise<Data> {
        const sampleData = await Promise.all(watchedFiles.map(loadSample))
        const chapterMap = new Map<string, Chapter>();
        for (const sd of sampleData) {
            const key = sd.chapter
            if (!chapterMap.has(key)) {
                chapterMap.set(key, {
                    name: key,
                    samples: []
                })
            }

            const chapter = chapterMap.get(key)!
            chapter.samples.push(sd)
        }

        return {chapters: Array.from(chapterMap.values())}
    }
})

async function loadSample(path: string): Promise<SampleData> {
    const code = await readFile(path, 'utf-8')

    const parsedPath = parse(path)
    const sampleName = parsedPath.name
    const chapterName = basename(parsedPath.dir)

    return {
        chapter: chapterName,
        name: sampleName,
        code
    }
}