import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { RootStackParamList } from '../types/navigation';
import { apiClient } from '../api/client';
import { DatabaseService } from '../database/database';
import { theme } from '../theme';
import { v4 as uuidv4 } from 'uuid';
=======
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../types/navigation';
import { apiClient } from '../api/client';
import { DatabaseService } from '../database/database';
import { theme } from '../theme';
import { v4 as uuidv4 } from 'uuid';
