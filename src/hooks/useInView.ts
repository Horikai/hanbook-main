import { useEffect, useRef, useState } from 'react'

type IntersectionOptions = {
    root?: Element | null
    rootMargin?: string
    threshold?: number | number[]
}

export function useInView<T extends HTMLElement = HTMLElement>(options?: IntersectionOptions) {
    const ref = useRef<T>(null)
    const [isInView, setIsInView] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsInView(true)
                observer.unobserve(entry.target)
            }
        }, {
            threshold: 0.1,
            rootMargin: '50px',
            ...options
        })

        const currentRef = ref.current
        if (currentRef) {
            observer.observe(currentRef)
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef)
            }
        }
    }, [options])

    return [ref, isInView] as const
} 