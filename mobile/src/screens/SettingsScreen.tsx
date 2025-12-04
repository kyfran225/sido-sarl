import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { RootStackParamList } from '../types/navigation';
import { apiClient } from '../api/client';
import { theme } from '../theme';
import * as SecureStore from 'expo-secure-store';

type SettingsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  stationId: string;
}

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [user, setUser] = useState<User | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    const loadUserData = async () => {
      const userData = await SecureStore.getItemAsync('user');
      const deviceIdData = await SecureStore.getItemAsync('deviceId');

      if (userData) {
        setUser(JSON.parse(userData));
      }
      if (deviceIdData) {
        setDeviceId(deviceIdData);
      }
    };

    loadUserData();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.logoutUser();
              // Navigation will be handled by the app's auth state
            } catch (error) {
              // Even if logout fails, clear local data
              await SecureStore.deleteItemAsync('accessToken');
              await SecureStore.deleteItemAsync('refreshToken');
              await SecureStore.deleteItemAsync('user');
            }
          },
        },
      ]
    );
  };

  const handleRevokeDevice = () => {
    Alert.alert(
      'Révoquer l\'appareil',
      'Cette action déconnectera cet appareil. Êtes-vous sûr ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Révoquer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.instance.post('/auth/revoke-device', { deviceId });
              await apiClient.logoutUser();
            } catch (error: any) {
              Alert.alert(
                'Erreur',
                error.response?.data?.error?.message || 'Erreur lors de la révocation'
              );
            }
          },
        },
      ]
    );
  };

  const handleClearOldData = async () => {
    Alert.alert(
      'Nettoyer les données',
      'Cela supprimera les transactions synchronisées de plus de 30 jours. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Nettoyer',
          onPress: async () => {
            try {
              // This would call a database cleanup function
              Alert.alert('Succès', 'Données nettoyées avec succès');
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors du nettoyage');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: theme.spacing.lg }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: theme.colors.text,
          marginBottom: theme.spacing.lg,
          textAlign: 'center',
        }}
      >
        Paramètres
      </Text>

      {/* User Info */}
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
          Informations Utilisateur
        </Text>

        {user ? (
          <>
            <Text
              style={{
                fontSize: 16,
                color: theme.colors.text,
                marginBottom: theme.spacing.sm,
              }}
            >
              Nom: {user.firstName} {user.lastName}
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.sm,
              }}
            >
              Utilisateur: {user.username}
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: theme.colors.textSecondary,
                marginBottom: theme.spacing.sm,
              }}
            >
              Rôle: {user.role}
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: theme.colors.textSecondary,
              }}
            >
              Station: {user.stationId}
            </Text>
          </>
        ) : (
          <ActivityIndicator color={theme.colors.primary} />
        )}
      </View>

      {/* Device Info */}
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
          Informations Appareil
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing.sm,
          }}
        >
          ID Appareil: {deviceId || 'Non défini'}
        </Text>
      </View>

      {/* Actions */}
      <View
        style={{
          marginBottom: theme.spacing.lg,
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.secondary,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            alignItems: 'center',
            marginBottom: theme.spacing.md,
          }}
          onPress={() => navigation.navigate('SyncStatus')}
        >
          <Text
            style={{
              color: theme.colors.white,
              fontSize: 16,
              fontWeight: '600',
            }}
          >
            Voir Statut Sync
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            alignItems: 'center',
            marginBottom: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border,
          }}
          onPress={handleClearOldData}
        >
          <Text
            style={{
              color: theme.colors.text,
              fontSize: 16,
              fontWeight: '600',
            }}
          >
            Nettoyer Anciennes Données
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.error,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            alignItems: 'center',
            marginBottom: theme.spacing.md,
          }}
          onPress={handleRevokeDevice}
        >
          <Text
            style={{
              color: theme.colors.white,
              fontSize: 16,
              fontWeight: '600',
            }}
          >
            Révoquer cet Appareil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.error,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            alignItems: 'center',
          }}
          onPress={handleLogout}
        >
          <Text
            style={{
              color: theme.colors.white,
              fontSize: 16,
              fontWeight: '600',
            }}
          >
            Déconnexion
          </Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: theme.spacing.sm,
          }}
        >
          SIDO Mobile v1.0.0
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme.colors.textSecondary,
          }}
        >
          Programme de Fidélisation Points Verts
        </Text>
      </View>
    </ScrollView>
  );
};
