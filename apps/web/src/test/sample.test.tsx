import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '~/components/ui/button'

describe('前端测试环境基建 (Frontend Test Environment)', () => {
  it('应当成功渲染并断言普通 DOM 元素', () => {
    // Arrange
    render(<div data-testid="test-div">Hello, Happy DOM!</div>)

    // Act
    const element = screen.getByTestId('test-div')

    // Assert
    expect(element).toBeInTheDocument()
    expect(element).toHaveTextContent('Hello, Happy DOM!')
  })

  it('应当能正确渲染 shadcn (Radix/CVA) Button 组件并支持交互', async () => {
    // Arrange
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(<Button onClick={handleClick}>Click Me</Button>)

    // Act
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()

    await user.click(button)

    // Assert
    expect(handleClick).toHaveBeenCalledOnce()
  })
})
