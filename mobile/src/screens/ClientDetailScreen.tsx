import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RootStackParamList } from '../types/navigation';
import { apiClient } from '../api/client';
import { Client, Bon } from '../../../packages/shared/src/types';
import { theme } from '../theme';

type ClientDetailScreenRouteProp = RouteProp<RootStackParamList, 'ClientDetail'>;
type ClientDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ClientDetail'>;

interface ClientWithPoints extends Client {
  points: {
    totalPoints: number;
    lastUpdated: string;
    history: Array<{
      date: string;
      points: number;
      type: 'earned' | 'used';
      description: string;
    }>;
  };
  bonsDisponibles: Bon[];
}

export const ClientDetailScreen: React.FC = () => {
  const navigation = useNavigation<ClientDetailScreenNavigationProp>();
  const route = useRoute<ClientDetailScreenRouteProp>();
  const { clientSid } = route.params;
  const queryClient = useQueryClient();

  const clientQuery = useQuery({
    queryKey: ['client', clientSid],
    queryFn: async () => {
      const response = await apiClient.instance.get(`/clients/${clientSid}`);
      return response.data as ClientWithPoints;
    },
  });

  const useBonMutation = useMutation({
    mutationFn: async (bonCode: string) => {
      const response = await apiClient.instance.post(`/bons/${bonCode}/use`);
      return response.data;
    },
    onSuccess: () => {
      // Refresh client data
      queryClient.invalidateQueries({ queryKey: ['client', clientSid] });
      Alert.alert('Succès', 'Bon utilisé avec succès!');
    },
    onError: (error: any) => {
      Alert.alert(
        'Erreur',
        error.response?.data?.error?.message || 'Erreur lors de l\'utilisation du bon'
      );
    },
  });

  const handleUseBon = (bon: Bon) => {
    Alert.alert(
      'Utiliser le Bon',
      `Voulez-vous utiliser le bon "${bon.code}" d'une valeur de ${bon.montantFCFA} FCFA ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Utiliser',
          onPress: () => useBonMutation.mutate(bon.code),
        },
      ]
    );
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'vip':
        return theme.colors.primary;
      case 'premium':
        return theme.colors.secondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getBonStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return theme.colors.success;
      case 'used':
        return theme.colors.textSecondary;
      case 'expired':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  if (clientQuery.isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
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
          Chargement du client...
        </Text>
      </View>
    );
  }

  if (clientQuery.isError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
          padding: theme.spacing.lg,
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
          Erreur de chargement
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            marginBottom: theme.spacing.lg,
          }}
        >
          Impossible de charger les informations du client.
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
          }}
          onPress={() => clientQuery.refetch()}
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
    );
  }

  const client = clientQuery.data!;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: theme.spacing.lg }}
    >
      {/* Client Info Header */}
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.lg,
          marginBottom: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: theme.spacing.sm,
          }}
        >
          {client.firstName} {client.lastName}
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing.sm,
          }}
        >
          SID: {client.sid}
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing.sm,
          }}
        >
          Téléphone: {client.phone}
        </Text>
        <View
          style={{
            backgroundColor: getSegmentColor(client.segment),
            alignSelf: 'flex-start',
            borderRadius: theme.borderRadius.sm,
            paddingHorizontal: theme.spacing.sm,
            paddingVertical: theme.spacing.xs,
          }}
        >
          <Text
            style={{
              color: theme.colors.white,
              fontSize: 12,
              fontWeight: '600',
              textTransform: 'uppercase',
            }}
          >
            {client.segment}
          </Text>
        </View>
      </View>

      {/* Points Section */}
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.lg,
          marginBottom: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: theme.spacing.md,
          }}
        >
          Points de Fidélité
        </Text>
        <Text
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.colors.primary,
            marginBottom: theme.spacing.sm,
          }}
        >
          {client.points.totalPoints} points
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme.colors.textSecondary,
          }}
        >
          Dernière mise à jour: {new Date(client.points.lastUpdated).toLocaleDateString('fr-FR')}
        </Text>
      </View>

      {/* Bons Disponibles */}
      <View
        style={{
          marginBottom: theme.spacing.lg,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: theme.spacing.md,
          }}
        >
          Bons Disponibles ({client.bonsDisponibles.length})
        </Text>

        {client.bonsDisponibles.length === 0 ? (
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.lg,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: theme.colors.textSecondary,
              }}
            >
              Aucun bon disponible
            </Text>
          </View>
        ) : (
          client.bonsDisponibles.map((bon) => (
            <View
              key={bon.code}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.sm,
                borderWidth: 1,
                borderColor: theme.colors.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme.colors.text,
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Code: {bon.code}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.colors.textSecondary,
                  }}
                >
                  Valeur: {bon.montantFCFA} FCFA
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: getBonStatusColor(bon.status),
                    fontWeight: '600',
                  }}
                >
                  {bon.status === 'available' ? 'Disponible' :
                   bon.status === 'used' ? 'Utilisé' :
                   bon.status === 'expired' ? 'Expiré' : bon.status}
                </Text>
              </View>
              {bon.status === 'available' && (
                <TouchableOpacity
                  style={{
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.sm,
                    paddingHorizontal: theme.spacing.md,
                  }}
                  onPress={() => handleUseBon(bon)}
                  disabled={useBonMutation.isLoading}
                >
                  <Text
                    style={{
                      color: theme.colors.white,
                      fontSize: 14,
                      fontWeight: '600',
                    }}
                  >
                    Utiliser
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};
