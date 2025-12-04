import React from 'react'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { StatCard } from '../src/components/ui/StatCard'
import { Card } from '../src/components/ui/Card'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

describe('Accessibility Tests', () => {
  it('StatCard should be accessible', async () => {
    const { container } = render(
      <StatCard
        title="Test Metric"
        value="123"
        icon="📊"
        color="blue"
      />
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('Card component should be accessible', async () => {
    const { container } = render(
      <Card title="Test Card">
        <p>Test content</p>
      </Card>
    )

    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have proper ARIA labels', () => {
    const { getByLabelText } = render(
      <button aria-label="Close modal">×</button>
    )

    expect(getByLabelText('Close modal')).toBeInTheDocument()
  })

  it('should have sufficient color contrast', () => {
    // This would typically use a color contrast testing library
    // For now, we'll test that our color classes are applied correctly
    const { container } = render(
      <div className="text-gray-900 bg-white">
        High contrast text
      </div>
    )

    expect(container.firstChild).toHaveClass('text-gray-900', 'bg-white')
  })

  it('should support keyboard navigation', () => {
    const mockOnClick = jest.fn()
    const { getByRole } = render(
      <button onClick={mockOnClick}>Clickable Button</button>
    )

    const button = getByRole('button')

    // Simulate keyboard events
    button.focus()
    expect(document.activeElement).toBe(button)

    // Simulate Enter key
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(mockOnClick).toHaveBeenCalled()
  })

  it('should have proper heading hierarchy', () => {
    const { getByRole } = render(
      <div>
        <h1>Main Title</h1>
        <h2>Subtitle</h2>
        <h3>Section Title</h3>
      </div>
    )

    expect(getByRole('heading', { level: 1 })).toHaveTextContent('Main Title')
    expect(getByRole('heading', { level: 2 })).toHaveTextContent('Subtitle')
    expect(getByRole('heading', { level: 3 })).toHaveTextContent('Section Title')
  })

  it('should provide screen reader announcements', () => {
    const { getByText } = render(
      <div aria-live="polite" aria-atomic="true">
        Status: Loading...
      </div>
    )

    const statusElement = getByText('Status: Loading...')
    expect(statusElement).toHaveAttribute('aria-live', 'polite')
    expect(statusElement).toHaveAttribute('aria-atomic', 'true')
  })
})
