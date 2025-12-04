import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransactionScreen } from '../src/screens/TransactionScreen';

// Mock the navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock the API client
jest.mock('../src/api/client', () => ({
  apiClient: {
    instance: {
      post: jest.fn(),
    },
  },
}));

// Mock the database
jest.mock('../src/database/database', () => ({
  enqueueTransaction: jest.fn(),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
}));

describe('TransactionScreen', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(
      <TransactionScreen />
    );

    expect(getByText('Nouvelle Transaction')).toBeTruthy();
    expect(getByPlaceholderText('SID du client')).toBeTruthy();
    expect(getByPlaceholderText('Montant (FCFA)')).toBeTruthy();
    expect(getByPlaceholderText('Litres')).toBeTruthy();
  });

  it('validates required fields', async () => {
    const { getByText } = renderWithProviders(<TransactionScreen />);

    const submitButton = getByText('Valider Transaction');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText('Veuillez remplir tous les champs')).toBeTruthy();
    });
  });

  it('validates SID format', async () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(
      <TransactionScreen />
    );

    const sidInput = getByPlaceholderText('SID du client');
    const amountInput = getByPlaceholderText('Montant (FCFA)');
    const litresInput = getByPlaceholderText('Litres');
    const submitButton = getByText('Valider Transaction');

    fireEvent.changeText(sidInput, 'INVALID-SID');
    fireEvent.changeText(amountInput, '1000');
    fireEvent.changeText(litresInput, '10');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText('Format SID invalide')).toBeTruthy();
    });
  });

  it('submits transaction successfully', async () => {
    const mockApiPost = require('../src/api/client').apiClient.instance.post;
    const mockEnqueueTransaction = require('../src/database/database').enqueueTransaction;

    mockApiPost.mockResolvedValueOnce({
      data: {
        transactionId: 'txn-123',
        pointsAwarded: 10,
        bonGenerated: null,
      },
    });

    const { getByText, getByPlaceholderText } = renderWithProviders(
      <TransactionScreen />
    );

    const sidInput = getByPlaceholderText('SID du client');
    const amountInput = getByPlaceholderText('Montant (FCFA)');
    const litresInput = getByPlaceholderText('Litres');
    const submitButton = getByText('Valider Transaction');

    fireEvent.changeText(sidInput, 'SIDO-001-000001');
    fireEvent.changeText(amountInput, '1000');
    fireEvent.changeText(litresInput, '10');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/transactions', expect.objectContaining({
        auditId: expect.any(String),
        clientSid: 'SIDO-001-000001',
        amountFCFA: 1000,
        litres: 10,
        deviceId: expect.any(String),
      }));
      expect(mockEnqueueTransaction).toHaveBeenCalled();
      expect(getByText('Transaction créée avec succès!')).toBeTruthy();
    });
  });

  it('handles offline mode', async () => {
    const mockApiPost = require('../src/api/client').apiClient.instance.post;
    const mockEnqueueTransaction = require('../src/database/database').enqueueTransaction;

    mockApiPost.mockRejectedValueOnce(new Error('Network Error'));

    const { getByText, getByPlaceholderText } = renderWithProviders(
      <TransactionScreen />
    );

    const sidInput = getByPlaceholderText('SID du client');
    const amountInput = getByPlaceholderText('Montant (FCFA)');
    const litresInput = getByPlaceholderText('Litres');
    const submitButton = getByText('Valider Transaction');

    fireEvent.changeText(sidInput, 'SIDO-001-000001');
    fireEvent.changeText(amountInput, '1000');
    fireEvent.changeText(litresInput, '10');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockEnqueueTransaction).toHaveBeenCalled();
      expect(getByText('Transaction mise en file d\'attente (offline)')).toBeTruthy();
    });
  });
});
