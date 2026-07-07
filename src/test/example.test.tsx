import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Example component for testing
function ExampleComponent({ message }: { message: string }) {
  return <div data-testid="example">{message}</div>;
}

describe('Example Test Suite', () => {
  it('should render component with message', () => {
    render(<ExampleComponent message="Hello, World!" />);
    expect(screen.getByTestId('example')).toHaveTextContent('Hello, World!');
  });

  it('should pass basic assertion', () => {
    expect(1 + 1).toBe(2);
  });
});
