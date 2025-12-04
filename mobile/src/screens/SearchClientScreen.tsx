import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { RootStackParamList } from '../types/navigation';
import { apiClient } from '../api/client';
import { Client } from '../../../packages/shared/src/types';
import { theme } from '../theme';

type SearchClientScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SearchClient'>;

export const SearchClientScreen: React.FC = () => {
  const navigation = useNavigation<SearchClientScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchQueryResult = useQuery({
    queryKey: ['clients', 'search', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return [];
      const response = await apiClient.instance.get('/clients/search', {
        params: { q: debouncedQuery },
      });
      return response.data.clients as Client[];
    },
    enabled: debouncedQuery.length >= 2,
  });

  const handleClientSelect = (client: Client) => {
    navigation.navigate('ClientDetail', { clientSid: client.sid });
  };

  const handleScanQR = () => {
    Alert.alert('Info', 'Scan QR à implémenter');
  };

  const renderClientItem = ({ item }: { item: Client }) => (
    <TouchableOpacity
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
      onPress={() => handleClientSelect(item)}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: theme.spacing.xs,
        }}
      >
        {item.firstName} {item.lastName}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing.xs,
        }}
      >
        SID: {item.sid}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: theme.colors.textSecondary,
        }}
      >
        Téléphone: {item.phone}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Search Header */}
      <View
        style={{
          backgroundColor: theme.colors.surface,
          padding: theme.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              fontSize: 16,
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              marginRight: theme.spacing.sm,
            }}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher par nom, téléphone ou SID..."
            placeholderTextColor={theme.colors.textSecondary}
          />
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.secondary,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
            }}
            onPress={handleScanQR}
          >
            <Text style={{ color: theme.colors.white, fontWeight: '600' }}>📱</Text>
          </TouchableOpacity>
        </View>

        {searchQuery.length > 0 && searchQuery.length < 2 && (
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.textSecondary,
              marginTop: theme.spacing.sm,
            }}
          >
            Tapez au moins 2 caractères pour rechercher
          </Text>
        )}
      </View>

      {/* Results */}
      <View style={{ flex: 1, padding: theme.spacing.md }}>
        {searchQueryResult.isLoading ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={{
                marginTop: theme.spacing.md,
                fontSize: 16,
                color: theme.colors.textSecondary,
              }}
            >
              Recherche en cours...
            </Text>
          </View>
        ) : searchQueryResult.isError ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 18,
                color: theme.colors.error,
                textAlign: 'center',
                marginBottom: theme.spacing.md,
              }}
            >
              Erreur de recherche
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                paddingHorizontal: theme.spacing.lg,
              }}
              onPress={() => searchQueryResult.refetch()}
            >
              <Text
                style={{
                  color: theme.colors.white,
                  fontSize: 16,
                  fontWeight: '600',
                }}
              >
                Réessayer
              </Text>
            </TouchableOpacity>
          </View>
        ) : searchQueryResult.data && searchQueryResult.data.length > 0 ? (
          <FlatList
            data={searchQueryResult.data}
            renderItem={renderClientItem}
            keyExtractor={(item) => item.sid}
            showsVerticalScrollIndicator={false}
          />
        ) : debouncedQuery.length >= 2 ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: theme.colors.textSecondary,
                textAlign: 'center',
              }}
            >
              Aucun client trouvé pour "{debouncedQuery}"
            </Text>
          </View>
        ) : (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: theme.colors.textSecondary,
                textAlign: 'center',
              }}
            >
              Commencez à taper pour rechercher un client
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};
