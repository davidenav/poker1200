// GamePlayersScreen.tsx
import React, { useLayoutEffect, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ImageBackground
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '../amplify/data/resource';
import { RootStackParamList } from './types';
import {
  calcPlayersStats,
  PlayerType,
  gameSelectionSeWithDebts,
  gameWithDebtType,
} from './Logic';

type Props = NativeStackScreenProps<RootStackParamList, 'GameStats'>;
const client = generateClient<Schema>();

const GameStatsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { gameId } = route.params;
  const [game, setGame] = useState<gameWithDebtType>();


  useEffect(() => {
    const fetchGame = async () => {
      try {
        const gameResult = await client.models.Game.get({
          id: gameId,
        },
          { selectionSet: gameSelectionSeWithDebts });

        if (!gameResult.data) {
          console.error('Game not found');
          return;
        }
        setGame(gameResult.data);
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    };

    fetchGame();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: `${game?.name} - Statistics`,
    });
  }, [navigation, game?.name]);

  const renderPlayer = ({ item }: { item: PlayerType }) => {
    const playerStats = calcPlayersStats(item);
    return (<View style={styles.playerItem}>
      <Text style={styles.playerName}>{item.player.name}</Text>
      <Text style={styles.playerName}>
        Invested: {playerStats.invested} {'\n'}
        Returned: {playerStats.returned} {'\n'}
        Total: {playerStats.total}
      </Text>
    </View>);
  };

  function renderRow(item: PlayerType) {
    const playerStats = calcPlayersStats(item);
    return (
      <View style={{ flex: 1, alignSelf: 'stretch', flexDirection: 'row', opacity: 0.8, borderRadius: 8, marginBottom: 8, backgroundColor: 'white' }} >
        <View style={{ flex: 1, alignSelf: 'stretch', justifyContent: 'center', backgroundColor: 'white', borderRadius: 8 }} >
          <Text style={styles.playerName}>{item.player.name}</Text>
        </View>
        <View style={{ flex: 1, alignSelf: 'stretch', justifyContent: 'center', borderRadius: 8 }} >
          <Text style={styles.playerName}>{playerStats.invested}</Text>
        </View>
        <View style={{ flex: 1, alignSelf: 'stretch', justifyContent: 'center', borderRadius: 8 }} >
          <Text style={styles.playerName}>{playerStats.returned}</Text>
        </View>
        <View style={{ flex: 1, alignSelf: 'stretch', justifyContent: 'center', borderRadius: 8 }} >
          <Text style={styles.playerName}>{playerStats.total}</Text>
        </View>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/58471.jpg')}
      resizeMode='cover'
      style={styles.image}
    >
      {game ? <View style={styles.container}>
        <Text style={styles.modalTitle}>Players</Text>



        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ flex: 1, alignSelf: 'stretch', flexDirection: 'row', opacity: 0.8, borderRadius: 8, marginBottom: 8, backgroundColor: 'lightblue' }} >
            <View style={{ flex: 1, alignSelf: 'stretch', justifyContent: 'center', backgroundColor: 'white', borderRadius: 8 }} >
              <Text style={styles.playerName}>Name</Text>
            </View>
            <View style={{ flex: 1, alignSelf: 'stretch', justifyContent: 'center', borderRadius: 8 }} >
              <Text style={styles.playerName}>Invested</Text>
            </View>
            <View style={{ flex: 1, alignSelf: 'stretch', justifyContent: 'center', borderRadius: 8 }} >
              <Text style={styles.playerName}>Returned</Text>
            </View>
            <View style={{ flex: 1, alignSelf: 'stretch', justifyContent: 'center', borderRadius: 8 }} >
              <Text style={styles.playerName}>Total</Text>
            </View>
          </View>
          {
            (game?.players ?? []).map((player) => { // This will render a row for each data element.
              return renderRow(player);
            })
          }
        </View>

        {/* <FlatList
          data={game?.players ?? []}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.id}
          style={styles.playersList}
        /> */}

        <Text style={styles.modalTitle}>Debts</Text>

        <FlatList
          data={game.gameDebts}
          renderItem={({ item }) => (
            <View style={styles.modalPlayerItem}>
              <Text style={styles.modalPlayerName}>
                {item.giver?.player?.name ?? "Pot"} owes {item.amount} to {item.receiver.player.name}
              </Text>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      </View> : <Text style={styles.modalTitle}>Loading game...</Text>}
    </ImageBackground>
  )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  playersList: {
    flex: 1,
  },
  playerItem: {
    // flexDirection: 'row',
    // flexWrap: 'wrap',
    // padding: 6,
    // borderBottomWidth: 1,
    // borderBottomColor: '#eee',
    // alignItems: 'center',
    // justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: 'white',
    opacity: 0.8,
    borderRadius: 8,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalTitle: {
    fontSize: 28,
    textAlign: 'center',
    fontWeight: 'bold',
    padding: 12,
  },
  modalPlayerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
    opacity: 0.8,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalPlayerName: {
    fontSize: 16,
  },
  modalPlayerDebt: {
    fontSize: 16,
    color: 'red',
  },
  image: {
    flex: 1,
    justifyContent: 'center',
  },

});

export default GameStatsScreen;
