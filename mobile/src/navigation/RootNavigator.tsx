
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";

import { useAuth } from "../context/AuthContext";
import AuthNavigator from "./AuthNavigator";
import { TaskProvider } from "../context/TaskContext";
import TaskListScreen from "../screens/tasks/TaskListScreen";

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading your account...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <NavigationContainer>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  return (
    <TaskProvider>
      <TaskListScreen />
    </TaskProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F7FB",
  },
  loadingText: {
    color: "#667085",
    marginTop: 12,
  },
});