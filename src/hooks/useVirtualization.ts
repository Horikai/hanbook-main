import { useState, useEffect, useCallback } from 'react'

interface VirtualizationOptions {
    itemHeight: number
    overscan?: number
    totalItems: number
}

export function useVirtualization({ itemHeight, overscan = 5, totalItems }: VirtualizationOptions) {
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 15 })
    const [containerHeight, setContainerHeight] = useState(0)

    const updateVisibleRange = useCallback(() => {
        const windowHeight = window.innerHeight
        const scrollTop = window.scrollY
        
        const visibleStart = Math.floor(scrollTop / itemHeight)
        const visibleEnd = Math.ceil((scrollTop + windowHeight) / itemHeight)
        
        const start = Math.max(0, visibleStart - overscan)
        const end = Math.min(totalItems, visibleEnd + overscan)
        
        requestAnimationFrame(() => {
            setVisibleRange({ start, end })
        })
    }, [itemHeight, overscan, totalItems])

    useEffect(() => {
        setContainerHeight(totalItems * itemHeight)
        updateVisibleRange()
        
        window.addEventListener('scroll', updateVisibleRange, { passive: true })
        window.addEventListener('resize', updateVisibleRange, { passive: true })
        
        return () => {
            window.removeEventListener('scroll', updateVisibleRange)
            window.removeEventListener('resize', updateVisibleRange)
        }
    }, [updateVisibleRange, totalItems, itemHeight])

    return {
        containerHeight,
        visibleRange,
    }
} 