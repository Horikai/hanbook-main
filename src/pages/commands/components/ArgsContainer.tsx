import type { CommandLists, Argument, CommandOption } from '@/pages/commands/App'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { type Dispatch, type SetStateAction, memo } from 'react'
import { SearchArgs, SelectArgs } from './ArgsType'

interface ArgumentsContainerProps {
	cmd: CommandLists
	arg: Argument
	handleArgSelect: (commandId: number, argKey: string, value: string) => void
	selectedArgs: { [key: number]: { [key: string]: string } }
	showResults: boolean
	searchResults: { id: string; name: string; description: string | undefined; image: string | undefined }[]
	setShowResults: Dispatch<SetStateAction<boolean>>
	setSearchResults: Dispatch<
		SetStateAction<{ id: string; name: string; description: string | undefined; image: string | undefined }[]>
	>
}

const ArgumentsContainer = memo(
	({
		cmd,
		arg,
		handleArgSelect,
		selectedArgs,
		showResults,
		searchResults,
		setShowResults,
		setSearchResults,
	}: ArgumentsContainerProps) => {
		// Helper function to get selected option from either direct options or data reference
		const getSelectedOption = (cmdArg: Argument, selectedValue: string): CommandOption | undefined => {
			if (typeof cmdArg.options === 'number') {
				const dataSet = cmd.data?.find((d) => d.id === cmdArg.options)
				return dataSet?.options.find((opt) => opt.value === selectedValue)
			}
			return cmdArg.options?.find((opt) => opt.value === selectedValue)
		}

		const renderArgInput = () => {
			const isOriginalArg = cmd.args?.some((cmdArg) => cmdArg.key === arg.key)
			const listRender = []

			if (isOriginalArg) {
				switch (arg.type) {
					case 'select':
						listRender.push(
							<SelectArgs
								key={`select-${cmd.id}-${arg.key}`}
								handleArgSelect={handleArgSelect}
								cmd={cmd}
								arg={arg}
								selectedArgs={selectedArgs}
								description={arg.description}
							/>
						)
						break
					case 'search':
						listRender.push(
							<SearchArgs
								key={`search-${cmd.id}-${arg.key}`}
								cmd={cmd}
								arg={arg}
								showResults={showResults}
								searchResults={searchResults}
								setShowResults={setShowResults}
								setSearchResults={setSearchResults}
								handleArgSelect={handleArgSelect}
								description={arg.description}
							/>
						)
						break
					case 'number':
					case 'string':
						listRender.push(
							<InputNumberString
								key={`number-${cmd.id}-${arg.key}`}
								cmd={cmd}
								arg={arg}
								handleArgSelect={handleArgSelect}
								selectedArgs={selectedArgs}
								description={arg.description}
							/>
						)
						break
					default:
				}

				const selectedValue = selectedArgs[cmd.id]?.[arg.key]
				if (selectedValue) {
					const selectedOption = getSelectedOption(arg, selectedValue)
					if (selectedOption?.args) {
						for (const additionalArg of selectedOption.args) {
							switch (additionalArg.type) {
								case 'select':
									listRender.push(
										<SelectArgs
											key={`additional-select-${cmd.id}-${additionalArg.key}`}
											cmd={cmd}
											arg={additionalArg}
											handleArgSelect={handleArgSelect}
											selectedArgs={selectedArgs}
											description={additionalArg.description}
										/>
									)
									break
								case 'search':
									listRender.push(
										<SearchArgs
											key={`additional-search-${cmd.id}-${additionalArg.key}`}
											cmd={cmd}
											arg={additionalArg}
											handleArgSelect={handleArgSelect}
											showResults={showResults}
											searchResults={searchResults}
											setShowResults={setShowResults}
											setSearchResults={setSearchResults}
											description={additionalArg.description}
										/>
									)
									break
								case 'number':
								case 'string':
									listRender.push(
										<InputNumberString
											key={`additional-number-${cmd.id}-${additionalArg.key}`}
											cmd={cmd}
											arg={additionalArg}
											handleArgSelect={handleArgSelect}
											selectedArgs={selectedArgs}
											description={additionalArg.description}
										/>
									)
									break
							}
						}
					}
				}
			}

			return listRender
		}

		return (
			<div key={`${cmd.id}-${cmd.name}-${arg.key}`} className='space-y-1'>
				<label
					htmlFor={`${cmd.id}-${arg.name}`}
					className='block text-sm font-medium text-gray-700 dark:text-gray-300'
				>
					{arg.key}
					<span className='ml-2 text-sm text-gray-500'>({arg.type})</span>
				</label>
				{renderArgInput()}
			</div>
		)
	}
)

interface InputNumberStringProps {
	cmd: CommandLists
	arg: Argument
	handleArgSelect: (commandId: number, argKey: string, value: string) => void
	selectedArgs: { [key: number]: { [key: string]: string } }
	description: string
}

const InputNumberString = memo(({ cmd, arg, handleArgSelect, selectedArgs, description }: InputNumberStringProps) => {
	if (arg.limit) {
		return (
			<>
				<div className='flex items-center mb-2 space-x-1'>
					<Label htmlFor={`toggle-${cmd.id}-${arg.key}`} className='text-sm'>
						Use Slider
					</Label>
					<Checkbox
						id={`toggle-${cmd.id}-${arg.key}`}
						onCheckedChange={(e) => {
							handleArgSelect(cmd.id, `${arg.key}-useSlider`, e.toString())
						}}
						checked={selectedArgs[cmd.id]?.[`${arg.key}-useSlider`] === 'true'}
					/>
				</div>
				{selectedArgs[cmd.id]?.[`${arg.key}-useSlider`] === 'true' ? (
					<Slider
						min={arg.limit.min}
						max={arg.limit.max}
						onValueChange={(e) => {
							handleArgSelect(cmd.id, arg.key, e[0].toString())
						}}
						className='w-full'
					/>
				) : (
					<Input
						type={arg.type === 'number' ? 'number' : 'text'}
						min={arg.limit.min}
						max={arg.limit.max}
						onChange={(e) => {
							handleArgSelect(cmd.id, arg.key, e.target.value)
						}}
						placeholder={`Enter ${arg.name}`}
						className='w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors duration-200'
					/>
				)}
				<p className='text-sm text-muted-foreground'>{description}</p>
			</>
		)
	}

	return (
		<>
			<Input
				type={arg.type === 'number' ? 'number' : 'text'}
				onChange={(e) => {
					handleArgSelect(cmd.id, arg.key, e.target.value)
				}}
				placeholder={`Enter ${arg.name}`}
				className='w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors duration-200'
			/>
			<p className='text-sm text-muted-foreground'>{description}</p>
		</>
	)
})

export default ArgumentsContainer
