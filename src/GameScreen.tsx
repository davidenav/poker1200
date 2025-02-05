// GameScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Button, Modal, ImageBackground, Image, Alert, TouchableWithoutFeedback, ListRenderItemInfo } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { generateClient } from 'aws-amplify/api';
import { RootStackParamList } from './types';
import { type Schema } from '../amplify/data/resource';
import { Float } from 'react-native/Libraries/Types/CodegenTypes';
import { calcGameStats, calcPlayersStats, gameType, PlayerType, gameSelectionSet } from './Logic';;

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;
const client = generateClient<Schema>();

type TransactionType = {
  id: string;
  name: string;
  cashAmountToPot: number;
  debtAmountToPot: number;
  createdAt: string;
}

const GameScreen: React.FC<Props> = ({ route, navigation }) => {
  const { gameId } = route.params;
  const [game, setGame] = useState<gameType>();
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isMoneyActionsModalVisible, setMoneyActionsModalVisible] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [cashOutAmount, setCashOutAmount] = useState('');
  const [selectedGamePlayer, setSelectedGamePlayer] = useState<PlayerType>();
  const [debtAmount, setDebtAmount] = useState('');
  const [gameDone, setGameDone] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);
  const [, updateState] = useState({});
  const [renderPlayers, setRenderPlayers] = useState(true);
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const PlayerListItem = ({ item }: { item: PlayerType }) => {
    const [expanded, setExpanded] = useState(false);
    const [moneyActionAmout, setMoneyActionAmout] = useState('100');

    const onItemPress = () => {
      setExpanded(!expanded);
    }

    const playerStats = calcPlayersStats(item);
    return (
      <View>
        <TouchableOpacity style={[styles.gameItem, item.cashedOut && { backgroundColor: '#c49f9f' }]}>
          <TouchableWithoutFeedback onPress={onItemPress}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', flex: 1, alignItems: 'center' }}>
              <Text style={[styles.gameName, { flex: 1 }]}>{item.player.name}</Text>
              <Image style={[styles.logo, { flex: 1 }]} source={require('../assets/How_to_Play_Pocket_Aces-removebg-preview.png')} />
              <View style={{ flexDirection: 'column', justifyContent: 'space-around', flex: 1, alignItems: 'center' }}>
                <Text style={styles.modalPlayerName}>Invested: {playerStats.invested}</Text>
                {item.cashedOut && <Text style={styles.modalPlayerName}>total: {playerStats.total}</Text>}
              </View>
              {(item.moneyTransactions.length === 0) && <TouchableOpacity
                style={[styles.actionButton, styles.removeButton]}
                onPress={() => handleRemovePlayer(item.id)}
              >
                <Text style={styles.actionButtonText}>🗑️</Text>
              </TouchableOpacity>}
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity >
        {expanded &&
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: 'white', borderRadius: 8, marginBottom: 8 }}>
            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderRightWidth: 4 }}>
              <Text style={[styles.addPlayerButtonText, { fontSize: 18 }]}>
                Statistics
              </Text>
              <Text></Text>
              <Text style={styles.addPlayerButtonText}>
                Invested: {playerStats.invested}
              </Text>
              <Text style={styles.addPlayerButtonText}>
                (Cash: {playerStats.cashIn}, Debt: {playerStats.debtIn})
              </Text>
              <Text style={styles.addPlayerButtonText}>
                {item.cashedOut ? `Returned: ${playerStats.returned}` : ''}
              </Text>
              <Text style={styles.addPlayerButtonText}>
                {item.cashedOut ? `Total: ${playerStats.total}` : ''}
              </Text>
              <Text style={styles.addPlayerButtonText}>
                {item.cashedOut ? `Debt To Pot: ${playerStats.debtToPot}` : ''}
              </Text>
            </View>
            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderRadius: 8, marginBottom: 8 }}>
              <Text style={[styles.addPlayerButtonText, { fontSize: 18 }]}>
                Actions
              </Text>
              <Text></Text>
              <TextInput
                style={[styles.input, { width: '50%', textAlign: 'center', height: 30, marginBottom: 8 }]}
                placeholder="Enter amount"
                keyboardType="numeric"
                onChangeText={(text) => setMoneyActionAmout(text)}
                defaultValue={moneyActionAmout}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', alignItems: 'center', backgroundColor: 'white', borderRadius: 8, marginBottom: 8 }}>
                <TouchableOpacity style={[((game?.state === 'Closed') || buttonClicked || item.cashedOut) ? styles.actionGameButtonDisabled : styles.actionGameButton, { maxWidth: 80, paddingHorizontal: 2 }]}
                  disabled={(game?.state === 'Closed') || buttonClicked || item.cashedOut}
                  onPress={async () => {
                    if (moneyActionAmout && parseFloat(moneyActionAmout) > 0) {
                      setButtonClicked(true);
                      const amount = parseFloat(moneyActionAmout);
                      Alert.alert(`${item.player.name} wants to cash in ${amount} with debt`, '', [
                        {
                          text: 'Cancel',
                          onPress: () => console.log('Cancel Pressed'),
                          style: 'cancel',
                        },
                        {
                          text: 'OK',
                          onPress: async () => {
                            await handleCashIn(item.id, 0.0, amount);
                          }
                        },
                      ]);
                      setButtonClicked(false);
                    }
                    else {
                      Alert.alert('Invalid amount');
                    }
                  }}>
                  <Text style={styles.actionGameText}>Cash In Debt</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[((game?.state === 'Closed') || buttonClicked || item.cashedOut) ? styles.actionGameButtonDisabled : styles.actionGameButton, { maxWidth: 80, paddingHorizontal: 2 }]}
                  disabled={(game?.state === 'Closed') || buttonClicked || item.cashedOut}
                  onPress={async () => {
                    if (moneyActionAmout && parseFloat(moneyActionAmout) > 0) {
                      setButtonClicked(true);
                      const amount = parseFloat(moneyActionAmout);
                      Alert.alert(`${item.player.name} wants to cash in ${amount} with money`, '', [
                        {
                          text: 'Cancel',
                          onPress: () => console.log('Cancel Pressed'),
                          style: 'cancel',
                        },
                        {
                          text: 'OK',
                          onPress: async () => {
                            await handleCashIn(item.id, amount, 0.0);
                          }
                        },
                      ]);
                      setButtonClicked(false);
                    }
                    else {
                      Alert.alert('Invalid amount');
                    }
                  }}>
                  <Text style={styles.actionGameText}>Cash In Money</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[((game?.state === 'Closed') || buttonClicked || item.cashedOut || item.moneyTransactions.length === 0) ? styles.actionGameButtonDisabled : styles.actionGameButton, { marginBottom: 8 }]}
                disabled={(game?.state === 'Closed') || buttonClicked || item.cashedOut || item.moneyTransactions.length === 0}
                onPress={async () => {
                  if (moneyActionAmout && parseFloat(moneyActionAmout) > 0) {
                    setButtonClicked(true);
                    const amount = parseFloat(moneyActionAmout);
                    Alert.alert(`${item.player.name} wants to cash out ${amount}`, '', [
                      {
                        text: 'Cancel',
                        onPress: () => console.log('Cancel Pressed'),
                        style: 'cancel',
                      },
                      {
                        text: 'OK',
                        onPress: async () => {
                          await handleCashOut(item, 0.0, amount);
                        }
                      },
                    ]);
                    setButtonClicked(false);
                  }
                  else {
                    Alert.alert('Invalid amount');
                  }
                }}>
                <Text style={styles.actionGameText}>Cash Out</Text>
              </TouchableOpacity>
              <TouchableOpacity style={((game?.state === 'Closed') || buttonClicked || playerStats.debtToPot <= 0) ? styles.actionGameButtonDisabled : styles.actionGameButton}
                disabled={(game?.state === 'Closed') || buttonClicked || playerStats.debtToPot <= 0}
                onPress={async () => {
                  if (moneyActionAmout && parseFloat(moneyActionAmout) > 0) {
                    setButtonClicked(true);
                    const amount = parseFloat(moneyActionAmout);
                    Alert.alert(`${item.player.name} wants to convert ${amount} debt to cash`, '', [
                      {
                        text: 'Cancel',
                        onPress: () => console.log('Cancel Pressed'),
                        style: 'cancel',
                      },
                      {
                        text: 'OK',
                        onPress: async () => {
                          await handleCashIn(item.id, amount, -amount);
                        }
                      },
                    ]);
                    setButtonClicked(false);
                  }
                  else {
                    Alert.alert('Invalid amount');
                  }
                }}>
                <Text style={styles.actionGameText}>Convert Debt</Text>
              </TouchableOpacity>
            </View>
          </View>}
      </View>
    );
  }

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const gameResult = await client.models.Game.get({
          id: gameId,
        }, { selectionSet: gameSelectionSet });

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

  const handleAddPlayer = async () => {
    if (newPlayerName.trim()) {
      try {
        const newPlayer = await client.models.Player.create({
          name: newPlayerName.trim(),
        });
        if (newPlayer.errors || !newPlayer.data) {
          throw new Error('create player failed');
        }
        const newGamePlayer = await client.models.GamePlayer.create({
          playerId: newPlayer.data.id,
          gameId: gameId,
          cashedOut: false,
        });
        const player = {
          id: newPlayer.data.id,
          name: newPlayer.data.name,
        }
        game?.players.push({
          player: player,
          id: newGamePlayer.data?.id ?? '',
          cashedOut: false,
          moneyTransactions: []
        });
        setNewPlayerName('');
      } catch (error) {
        console.error('Error adding player:', error);
      }
    }
  };

  const handleCashOut = async (gamePlayer: PlayerType, cashAmount: Float, debtAmout: Float) => {
    await handleCashIn(gamePlayer.id, -cashAmount, -debtAmout);
    setGame((prevGame) => {
      if (!prevGame) return prevGame;
      return {
        ...prevGame,
        players: prevGame.players.map((player) =>
          player.id === gamePlayer.id ? { ...player, cashedOut: true } : player
        ),
      };
    });
    await client.models.GamePlayer.update({
      id: gamePlayer.id,
      cashedOut: true,
    });
  }

  const handleCashIn = async (gamePlayerId: string, cashAmount: Float, debtAmout: Float) => {
    try {
      // Assuming there's a cashIn method in the client to handle the cash in process
      const response = await client.models.MoneyTransaction.create({
        gamePlayerId: gamePlayerId,
        cashAmountToPot: cashAmount,
        debtAmountToPot: debtAmout,
      });
      game?.players.filter(player => player.id === gamePlayerId)[0].moneyTransactions.push({
        id: response.data?.id ?? '',
        cashAmountToPot: cashAmount,
        debtAmountToPot: debtAmout,
        createdAt: response.data?.createdAt ?? '',
      });
      forceUpdate();
      if (response.errors || !response.data) {
        throw new Error('Cash in failed');
      }
      Alert.alert('Success', 'Player cashed in successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to cash in player');
    }
  };

  const handleRemovePlayer = async (gamePlayerId: string) => {
    const toBeDeletedGamePlayer = {
      id: gamePlayerId
    }
    const { data: deletedTodo, errors } = await client.models.GamePlayer.delete(toBeDeletedGamePlayer)
    if (game) {
      setGame({
        ...game,
        players: game.players.filter(player => player.id !== gamePlayerId),
      });
    }
  };

  const handleRemoveTransaction = async (transactionId: string) => {
    Alert.alert('Are you sure you want to delete this transaction?', '', [
      {
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: async () => {
          const toBeDeletedTransaction = {
            id: transactionId
          }
          const { data: deletedTodo, errors } = await client.models.MoneyTransaction.delete(toBeDeletedTransaction)
          if (errors) {
            console.error('Error deleting transaction:', errors);
            return;
          }
          if (game) {
            setGame({
              ...game,
              players: game.players.map(player => ({
                ...player,
                moneyTransactions: player.moneyTransactions.filter(transaction => transaction.id !== transactionId)
              })),
            });
          }
        }
      },
    ]);
  };

  const renderPlayer = ({ item }: ListRenderItemInfo<PlayerType>) => {
    return <PlayerListItem item={item} />;
  };

  const renderTransaction = ({ item }: { item: TransactionType }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', alignItems: 'center', backgroundColor: 'white', borderRadius: 8, marginBottom: 8 }} >
      <View style={{ flexDirection: 'column', justifyContent: 'space-around' }}>
        <Text style={styles.modalPlayerName}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
        <Text style={styles.gameName}>{item.name}</Text>
      </View>
      <Image style={styles.logo} source={require('../assets/istockphoto-1155207821-612x612-removebg-preview.png')} />
      <Text style={styles.modalPlayerName}>
        {(item.cashAmountToPot > 0 && item.cashAmountToPot + item.debtAmountToPot === 0)
          ? `Converted ${item.cashAmountToPot} `
          : (item.debtAmountToPot <= 0)
            ? `Cashed out: ${item.debtAmountToPot}`
            : (item.debtAmountToPot > 0)
              ? `Cashed in: ${item.debtAmountToPot} debt`
              : (item.cashAmountToPot > 0)
                ? `Cashed in: ${item.cashAmountToPot} cash`
                : ''}
      </Text>
      <TouchableOpacity
        style={[styles.actionButton, styles.removeButton]}
        onPress={() => handleRemoveTransaction(item.id)}
      >
        <Text style={styles.actionButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  const handleSaveGameName = async (gameName: string) => {
    setGame((prevGame) => prevGame ? { ...prevGame, name: gameName } : prevGame);
    await client.models.Game.update({
      id: gameId,
      name: gameName,
    });
  }

  const saveDebtReport = async (debtReport: { giver: string, giverId: string, receiver: string, receiverId: string, amount: number }[]) => {
    if (debtReport) {
      for (const element of debtReport) {
        await client.models.GameDebt.create({ gameId: gameId, giverId: element.giverId, receiverId: element.receiverId, amount: element.amount });
      }
    }
  }

  const calcDebts = (): Array<{ giver: string, giverId: string, receiver: string, receiverId: string, amount: number }> => {
    {
      const gameStats = calcGameStats(game ?? {} as gameType);
      const playerStatsMapWithId = new Map(
        game?.players.map(player => [
          player.id,
          { name: player.player.name ?? '', debtToPot: calcPlayersStats(player)?.debtToPot ?? 0 },
        ])
      );
      if (gameStats.returned > gameStats.invested) {
        let count = 0;
        playerStatsMapWithId.forEach((value, key) => {
          if (value.debtToPot < 0) {
            count++;
          }
        });
        const distributeMoney = (gameStats.returned - gameStats.invested) / count;
        playerStatsMapWithId.forEach((value, key) => {
          if (value.debtToPot < 0) {
            value.debtToPot += distributeMoney;
            if (value.debtToPot > 0) { // TODO: need to handle this case
              value.debtToPot = 0;
            }
          }
        });
      } else if (gameStats.returned < gameStats.invested) {
        let count = 0;
        playerStatsMapWithId.forEach((value, key) => {
          if (value.debtToPot > 0) {
            count++;
          }
        });
        const deductMoney = (gameStats.invested - gameStats.returned) / count;
        playerStatsMapWithId.forEach((value, key) => {
          if (value.debtToPot > 0) {
            value.debtToPot -= deductMoney;
            if (value.debtToPot < 0) { // TODO: need to handle this case
              value.debtToPot = 0;
            }
          }
        });
      }
      playerStatsMapWithId.set('pot', { name: 'Pot', debtToPot: gameStats.cashIn });

      const calculateDebts = (statsMap: Map<string, { name: string, debtToPot: number }>) => {
        const debts: Array<{ giver: string, giverId: string, receiver: string, receiverId: string, amount: number }> = [];

        //TODO - find all debt entries that match with negative values
        const negativeMap = new Map<number, string[]>();

        // Populate the map with negative values and their absolute counterparts
        statsMap.forEach((value, key) => {
          if (value.debtToPot < 0) {
            const absNum = Math.abs(value.debtToPot);
            if (!negativeMap.has(absNum)) {
              negativeMap.set(absNum, []);
            }
            negativeMap.get(absNum)!.push(key);
          }
        });

        // Find matching positive and negative values
        const matchingNegatives: Map<string, string> = new Map();
        statsMap.forEach((value, key) => {
          if (value.debtToPot > 0 && negativeMap.has(value.debtToPot) && negativeMap.get(value.debtToPot)!.length > 0) {
            const recieverId = negativeMap.get(value.debtToPot)!.pop()!;
            matchingNegatives.set(recieverId, key);
          }
        });

        matchingNegatives.forEach((giver, receiver) => {
          const giverStats = statsMap.get(giver)!;
          const receiverStats = statsMap.get(receiver)!;
          const amount = giverStats.debtToPot;
          debts.push({ giver: giverStats.name, giverId: giver, receiver: receiverStats.name, receiverId: receiver, amount: amount });
          statsMap.delete(giver);
          statsMap.delete(receiver);
        });

        const positivePlayers = Array.from(statsMap.entries())
          .filter(([_, stats]) => stats.debtToPot > 0)
          .sort((a, b) => b[1].debtToPot - a[1].debtToPot);
        const negativePlayers = Array.from(statsMap.entries())
          .filter(([_, stats]) => stats.debtToPot < 0)
          .sort((a, b) => a[1].debtToPot - b[1].debtToPot);

        while (positivePlayers.length > 0 && negativePlayers.length > 0) {
          const [giver, giverStats] = positivePlayers[0];
          const [receiver, receiverStats] = negativePlayers[0];
          const amount = Math.min(giverStats.debtToPot, -receiverStats.debtToPot);
          debts.push({ giver: giverStats.name, giverId: giver, receiver: receiverStats.name, receiverId: receiver, amount });
          giverStats.debtToPot -= amount;
          receiverStats.debtToPot += amount;
          if (giverStats.debtToPot === 0) {
            positivePlayers.shift();
          }
          if (receiverStats.debtToPot === 0) {
            negativePlayers.shift();
          }
        }

        return debts;
      };

      const res = calculateDebts(playerStatsMapWithId);
      return res;
    }
  }

  function GetTransactions(game: gameType): TransactionType[] {
    return (game?.players ?? [])
      .flatMap(player => player.moneyTransactions.map(transaction => ({
        id: transaction.id,
        name: player.player.name ?? '',
        debtAmountToPot: transaction.debtAmountToPot ?? 0,
        cashAmountToPot: transaction.cashAmountToPot ?? 0,
        createdAt: transaction.createdAt
      }))).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return (
    <ImageBackground
      source={require('../assets/58471.jpg')}
      resizeMode='cover'
      style={styles.image}
    >
      <View style={styles.container}>
        <TextInput
          style={styles.title}
          value={game?.name ?? ''}
          onChangeText={(text) => setGame((prevGame) => prevGame ? { ...prevGame, name: text } : prevGame)}
          onEndEditing={(event) => handleSaveGameName(event.nativeEvent.text)}
          editable={game?.state !== 'Closed'}
        />
        {game && (() => {
          const gameStats = calcGameStats(game);
          return (
            <Text style={styles.playerName}>
              Total Invested: {gameStats.invested} (Cash: {gameStats.cashIn}, Debt: {gameStats.debtIn}) {"\n"}
              Total Returned: {gameStats.returned}
            </Text>
          );
        })()}
        <View style={styles.addPlayerContainer}>
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 8 }}>
            <TextInput
              style={styles.input}
              value={newPlayerName}
              onChangeText={setNewPlayerName}
              placeholder="Enter player's name"
            />
            <TouchableOpacity style={(game?.state === 'Closed') ? styles.actionGameButtonDisabled : styles.actionGameButton} disabled={game?.state === 'Closed'} onPress={handleAddPlayer} >
              <Text style={styles.actionGameText}>Add New Player</Text>
            </TouchableOpacity>
          </View>
        </View>
        {renderPlayers ? <FlatList
          data={game?.players?.sort((a, b) => ((b.player.name ?? '') > (a.player.name ?? '')) ? 1 : -1) ?? []}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.id}
          style={styles.playersList}
        /> : <FlatList
          data={game ? GetTransactions(game) : []}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          style={styles.playersList}
        />}

        <View style={styles.addPlayerContainer}>
          <TouchableOpacity
            style={[styles.actionGameButton]}
            onPress={() => setRenderPlayers(!renderPlayers)}
            disabled={false}
          >
            <Text style={styles.actionGameText}>{renderPlayers ? 'Show Transactions' : 'Show Players'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={game?.players.some(player => !player.cashedOut) ? styles.actionGameButtonDisabled : styles.actionGameButton}
            onPress={() => {
              const gameStats = calcGameStats(game ?? {} as gameType);
              const report = calcDebts();
              const message1 = (gameStats.invested > gameStats.returned) ? `money is missing (${gameStats.invested - gameStats.returned}) and will be deducted evenly from winners` :
                (gameStats.invested < gameStats.returned) ? `money is left  (${gameStats.returned - gameStats.invested}) and will be distributed evenly to loosers` : 'Perfect!';
              const message2 = report.map((item) => `${item.giver} owes ${item.amount} to ${item.receiver}`).join('\n');
              Alert.alert(message1, message2, [
                {
                  text: 'Cancel',
                  onPress: () => console.log('Cancel Pressed'),
                  style: 'cancel',
                },
                {
                  text: 'OK',
                  onPress: async () => {
                    try {
                      await client.models.Game.update({
                        id: gameId,
                        state: 'Closed',
                      });
                      setGame((prevGame) => {
                        if (!prevGame) return prevGame;
                        return {
                          ...prevGame,
                          state: 'Closed',
                        };
                      });
                      await saveDebtReport(report);

                      Alert.alert('Success', 'Game has been closed');
                      navigation.navigate('GameStats', { gameId: game?.id ?? '' });
                    } catch (error) {
                      Alert.alert('Error', 'Failed to close the game');
                    }
                  }
                },
              ]);
            }}
            disabled={game?.players.some(player => !player.cashedOut)}
          >
            <Text style={styles.actionGameText}>End Game</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  addPlayerContainer: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addPlayerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    padding: 4,
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 4,
    backgroundColor: 'white',
  },
  playersList: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 80,
    minHeight: 40,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  removeButton: {
    backgroundColor: '#757575',
    minWidth: 40,
    minHeight: 40,
  },
  modalPlayerName: {
    fontSize: 16,
  },
  image: {
    flex: 1,
    justifyContent: 'center',
  },
  gameItem: {
    padding: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: 'white',
    opacity: 0.8,
    borderRadius: 8,
    marginBottom: 8,
  },
  logo: {
    width: 66,
    height: 58,
  },
  gameName: {
    paddingLeft: 8,
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionGameButton: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#190224',
    maxWidth: 240,
  },
  actionGameButtonDisabled: {
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#ccc',
    maxWidth: 240,
  },
  actionGameText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
    padding: 8,
  },
});

export default GameScreen;
