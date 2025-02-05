import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { useIsFocused } from "@react-navigation/native";
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '../amplify/data/resource';
import type { SelectionSet } from 'aws-amplify/data';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

// Type for a game item
interface GameWrapper {
  id: string;
  name: string | null;
  date: string | null;
  state: string | null;
}

type Props = NativeStackScreenProps<RootStackParamList, 'GamesList'>;

const client = generateClient<Schema>();

const gamesSelectionSet = ['email', 'player.id', 'player.name', 'player.games.game.id', 'player.games.game.name', 'player.games.game.date', 'player.games.game.state', 'player.games.game.updatedAt'] as const;
type GamesType = SelectionSet<Schema['UserProfile']['type'], typeof gamesSelectionSet>;

const GamesList: React.FC<Props> = ({ navigation }) => {
  const isFocused = useIsFocused();
  const { user } = useAuthenticator();
  const [games, setGames] = useState<GamesType>();
  const [newGameClicked, setNewGameClicked] = useState(false);

  useEffect(() => {
    const fetchGames = async () => {
      if (user?.signInDetails?.loginId) {
        console.log('Fetching games for user:', user.signInDetails?.loginId);
        try {
          // First get the user profile
          const userProfileResult = await client.models.UserProfile.get({
            email: user.signInDetails?.loginId.toLowerCase(),
          }, { selectionSet: gamesSelectionSet });

          if (!userProfileResult.data || userProfileResult.errors) {
            console.error('No user profile found:', userProfileResult.errors);
            throw new Error('No user profile found');
          }

          setGames(userProfileResult.data);
        } catch (error) {
          console.error('Error fetching games:', error);
        } 
      };

    }

    fetchGames();

  }, [isFocused]);

  const renderItem = ({ item }: { item: GameWrapper }) => (
    <TouchableOpacity
      style={[styles.gameItem, item.state === 'Open' && { backgroundColor: '#c49f9f' }]}
      onPress={() => item.state !== 'Open' ? navigation.navigate('GameStats', { gameId: item.id }) : navigation.navigate('Game', { gameId: item.id })}
    >
      <View style={{ flexDirection: 'column', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
          <Text style={styles.gameName}>{item.name}</Text>
          <Text style={styles.gameDate}>{item.date}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', alignItems: 'center' }}>
          <Image style={styles.logo} source={require('../assets/casino-cards-png-falling-poker-chips-11562995898mdvm5phghg-removebg-preview.png')} />
          {/* <View style={{ flexDirection: 'column', justifyContent: 'space-around' }}>
            <Text style={styles.gameName}>Total Money: TODO</Text>
            <Text style={styles.gameName}>Big winner: TODO</Text>
          </View> */}
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleNewGame = async () => {
    const gameName = 'New Game'; // Define the game name
    const date = new Date(Date.now());; // Define the dateß
    const dateString = date.toISOString().split('T')[0];
    const ownerId = games?.player.id ?? ''; // Define the owner ID

    try {
      setNewGameClicked(true);
      const newGame = await client.models.Game.create({
        name: gameName,
        date: dateString,
        state: 'Open',
        moneyChipRatio: 2, // Default valu
        ownerId: ownerId,
      });
      if (!newGame.data || newGame.errors) {
        console.error('Error creating new game:', newGame.errors);
        return;
      }
      const newGamePlayer = await client.models.GamePlayer.create({
        playerId: games?.player.id ?? '',
        gameId: newGame.data?.id ?? '',
        cashedOut: false,
      });
      navigation.navigate('Game', { gameId: newGame.data?.id ?? '' });
    } catch (error) {
      console.error('Error creating new game:', error);
    } finally {
      setNewGameClicked(false);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/58471.jpg')}
      resizeMode='cover'
      style={styles.image}
    >
      <View style={styles.container}>
        {games ? <FlatList
          data={games?.player?.games?.
            sort((a, b) => (b.game.updatedAt > a.game.updatedAt) ? 1 : -1).
            map(item => ({
              id: item.game.id,
              name: item.game.name,
              date: item.game.date,
              state: item.game.state,
            })) ?? []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
        /> : <Text style={styles.modalTitle}>Loading games...</Text>}
        <TouchableOpacity
          style={newGameClicked ? styles.newGameButtonDisabled : styles.newGameButton}
          onPress={async () => await handleNewGame()}
          disabled={newGameClicked}
        >
          <Text style={styles.newGameText}>NEW GAME</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  image: {
    flex: 1,
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  gameItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: 'white',
    opacity: 0.8,
    borderRadius: 8,
    marginBottom: 8,

  },
  modalTitle: {
    fontSize: 28,
    textAlign: 'center',
    fontWeight: 'bold',
    padding: 12,
  },
  gameName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameDate: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  playerCount: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  newGameButton: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#190224',
    maxWidth: 240,
  },
  newGameButtonDisabled: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#ccc',
    maxWidth: 240,
  },
  Button: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#190224',
    maxWidth: 240,
  },
  newGameText: {
    color: 'white',
    fontSize: 28,
    textAlign: 'center',
    fontWeight: 'bold',
    padding: 8,
  },
  logo: {
    width: 66,
    height: 58,
  },
});

export default GamesList;