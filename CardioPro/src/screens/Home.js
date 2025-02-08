import React from "react";
import { View, Text, Button } from "react-native";
import { useAuth } from "../context/auth/AuthContext";

const Home = () => {
  const { user, logout } = useAuth();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {user ? (
        <>
          <Text style={{ fontSize: 18, marginBottom: 20 }}>
            Welcome, {user.email}
          </Text>
          <Button title="Logout" onPress={logout} />
        </>
      ) : (
        <Text style={{ fontSize: 18 }}>No user is logged in.</Text>
      )}
    </View>
  );
};

export default Home;
