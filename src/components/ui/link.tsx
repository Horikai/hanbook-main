import * as React from 'react'
import { cn } from '@/lib/utils'
import { cva } from 'class-variance-authority'
import { open } from '@tauri-apps/plugin-shell'

type Variant = 'default' | 'no-underline'

export interface LinkProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	href: string
	children?: React.ReactNode
	className?: string
	target?: string
	variant?: Variant
}

const LinkVariants = cva('text-sm font-medium text-blue-500 underline hover:text-blue-800', {
	variants: {
		variant: {
			default: 'text-sm font-medium text-blue-500 underline hover:text-blue-800',
			'no-underline': 'text-sm font-medium text-blue-500 hover:text-blue-800 no-underline',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
})

const Link = React.forwardRef<HTMLButtonElement, LinkProps>(
	({ className, href, children, variant = 'default', ...props }) => {
		const openBrowser = () => {
			open(href).catch((e) => {
				console.error(e)
			})
		}
		return (
			<button type='button' className={cn(LinkVariants({ variant }), className)} {...props} onClick={openBrowser}>
				{children}
			</button>
		)
	}
)

Link.displayName = 'Link'

export { Link }
