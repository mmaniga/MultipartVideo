/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {Component} from 'react';
import type {Node} from 'react';
import {
    SafeAreaView,
    StyleSheet,
    ScrollView,
    View,
    Text,
    Dimensions,
    Button,
    TouchableOpacity,
} from 'react-native';

import {
    OT,
    OTSession,
    OTPublisher,
    OTSubscriber,
    OTSubscriberView,
} from 'opentok-react-native';


import * as credentials from './config';

import Icon from 'react-native-vector-icons/MaterialIcons';

const dimensions = {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
};

const mainSubscribersResolution = {width: 1280, height: 720};
const secondarySubscribersResolution = {width: 352, height: 288};

/*
const App: () => Node = () => {
  return (
      <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center"
          }}>
        <Text>Multi Part Video Starter Code !@@-!</Text>
      </View>
  );
};
*/

class App extends Component {
    constructor(props) {
        super(props);
        this.apiKey = credentials.API_KEY;
        this.sessionId = credentials.SESSION_ID;
        this.token = credentials.TOKEN;
        this.state = {
            subscriberIds: [], // Array for storing subscribers
            localPublishAudio: true, // Local Audio state
            localPublishVideo: true, // Local Video state
            joinCall: false, // State variable for storing success
            streamProperties: {}, // Handle individual stream properties,
            mainSubscriberStreamId: null,
        };

        /*
          List of events
          streamCreated: 'onStreamReceived',
          streamDestroyed: 'onStreamDropped',
          sessionConnected: 'onConnected',
          sessionDisconnected: 'onDisconnected',
          signal: 'onSignalReceived',
          connectionCreated: 'onConnectionCreated',
          connectionDestroyed: 'onConnectionDestroyed',
          error: 'onError',
          sessionReconnected: 'onReconnected',
          sessionReconnecting: 'onReconnecting',
          archiveStarted: 'onArchiveStarted',
          archiveStopped: 'onArchiveStopped',
          streamPropertyChanged: 'onStreamPropertyChanged',
         */
        this.sessionEventHandlers = {
            streamCreated: (event) => {
                console.log("sessionEventHandlers event streamCreated received")
                const streamProperties = {
                    ...this.state.streamProperties,
                    [event.streamId]: {
                        subscribeToAudio: true,
                        subscribeToVideo: true,
                    },
                };
                this.setState({
                    streamProperties,
                    subscriberIds: [...this.state.subscriberIds, event.streamId],
                });
                console.log('streamCreated', this.state);
            },
            streamDestroyed: (event) => {
                console.log("sessionEventHandlers event streamDestroyed received")
                const indexToRemove = this.state.subscriberIds.indexOf(event.streamId);
                const newSubscriberIds = this.state.subscriberIds;
                const streamProperties = {...this.state.streamProperties};
                if (indexToRemove !== -1) {
                    delete streamProperties[event.streamId];
                    newSubscriberIds.splice(indexToRemove, 1);
                    this.setState({subscriberIds: newSubscriberIds});
                }
            },
            error: (error) => {
                console.log('session error:', error);
            },
            otrnError: (error) => {
                console.log('Session otrnError error:', error);
            },
            sessionDisconnected: () => {
                console.log("sessionEventHandlers event sessionDisconnected received")
                this.setState({
                    streamProperties: {},
                    subscriberIds: [],
                });
            },
            sessionConnected: () => {
                console.log("sessionEventHandlers event sessionConnected received")
            },
            sessionReconnected: () => {
                console.log("sessionEventHandlers event sessionReconnected received")
            },
            signal :() => {
                console.log("sessionEventHandlers event signal received..");
            },
            connectionCreated: () => {
                console.log("sessionEventHandlers event connectionCreated received");
            },
            connectionDestroyed: () => {
                console.log("sessionEventHandlers event connectionDestroyed received");
            },
            sessionReconnecting: () => {
                console.log("sessionEventHandlers event sessionReconnecting received");
            },
            archiveStarted: () => {
                console.log("sessionEventHandlers event archiveStarted received");
            },
            archiveStopped: () => {
                console.log("sessionEventHandlers event archiveStopped received");
            },
            streamPropertyChanged: () => {
                console.log("sessionEventHandlers event streamPropertyChanged received");
            },
        };

        this.publisherEventHandlers = {
            streamCreated: (event) => {
            console.log('Publisher stream created!', event);
            },
            streamDestroyed: (event) => {
                console.log('Publisher stream destroyed!', event);
            },
            audioLevel: (event) => {
                console.log('AudioLevel', typeof event);
            },
            error: (error) => {
                console.log("PublisherEventHandler event error ", error);
            },
        };

        /*
          connected: 'onConnected',
          disconnected: 'onDisconnected',
          reconnected: 'onReconnected',
          error: 'onError',
          audioNetworkStats: 'onAudioStats',
          videoNetworkStats: 'onVideoStats',
          audioLevel: 'onAudioLevelUpdated',
          videoDisabled: 'onVideoDisabled',
          videoEnabled: 'onVideoEnabled',
          videoDisableWarning: 'onVideoDisableWarning',
          videoDisableWarningLifted: 'onVideoDisableWarningLifted',
          videoDataReceived: 'onVideoDataReceived',
         */
        this.subscriberEventHandlers = {
            connected: () => {
                console.log('[subscriberEventHandlers - connected]');
            },
            disconnected: () => {
                console.log('[subscriberEventHandlers - disconnected]');
            },
            error: (error) => {
                console.log('subscriberEventHandlers error:', error);
            },
            reconnected: () => {
                console.log('[subscriberEventHandlers - reconnected]');
            },
            audioNetworkStats: () => {
                console.log('[subscriberEventHandlers - audioNetworkStats]');
            },
            videoNetworkStats: () => {
                console.log('[subscriberEventHandlers - videoNetworkStats]');
            },
            audioLevel: () => {
                console.log('[subscriberEventHandlers - audioLevel]');
            },
            videoDisabled: () => {
                console.log('[subscriberEventHandlers - videoDisabled]');
            },
            videoEnabled: () => {
                console.log('[subscriberEventHandlers - videoEnabled]');
            },
            videoDisableWarning: () => {
                console.log('[subscriberEventHandlers - videoDisableWarning]');
            },
            videoDisableWarningLifted: () => {
                console.log('[subscriberEventHandlers - videoDisableWarningLifted]');
            },
            videoDataReceived: () => {
                console.log('[subscriberEventHandlers - videoDataReceived]');
            },
        };

        this.publisherProperties = {
            cameraPosition: 'front',
        };
    }

    toggleAudio = () => {
        let publishAudio = this.state.localPublishAudio;
        this.publisherProperties = {
            ...this.publisherProperties,
            publishAudio: !publishAudio,
        };
        this.setState({
            localPublishAudio: !publishAudio,
        });
    };

    toggleVideo = () => {
        let publishVideo = this.state.localPublishVideo;
        this.publisherProperties = {
            ...this.publisherProperties,
            publishVideo: !publishVideo,
        };
        this.setState({
            localPublishVideo: !publishVideo,
        });
        console.log('Video toggle', this.publisherProperties);
    };

    joinCall = () => {
        console.log("Entering into joinCall after the joinCall pressed..")
        const {joinCall} = this.state;
        if (!joinCall) {
            this.setState({joinCall: true});
        }
        console.log("In joinCall changed state of joinCall " + this.state);
    };

    endCall = () => {
        const {joinCall} = this.state;
        if (joinCall) {
            this.setState({joinCall: !joinCall});
        }
    };

    /**
     * // todo check if the selected is a publisher. if so, return
     * @param {*} subscribers
     */
    handleSubscriberSelection = (subscribers, streamId) => {
        console.log('handleSubscriberSelection', streamId);
        let subscriberToSwap = subscribers.indexOf(streamId);
        let currentSubscribers = subscribers;
        let temp = currentSubscribers[subscriberToSwap];
        currentSubscribers[subscriberToSwap] = currentSubscribers[0];
        currentSubscribers[0] = temp;
        this.setState((prevState) => {
            const newStreamProps = {...prevState.streamProperties};
            for (let i = 0; i < currentSubscribers.length; i += 1) {
                if (i === 0) {
                    newStreamProps[currentSubscribers[i]] = {
                        ...prevState.streamProperties[currentSubscribers[i]],
                    };
                    newStreamProps[
                        currentSubscribers[i]
                        ].preferredResolution = mainSubscribersResolution;
                } else {
                    newStreamProps[currentSubscribers[i]] = {
                        ...prevState.streamProperties[currentSubscribers[i]],
                    };
                    newStreamProps[
                        currentSubscribers[i]
                        ].preferredResolution = secondarySubscribersResolution;
                }
            }
            console.log('mainSubscriberStreamId', streamId);
            console.log('streamProperties#2', newStreamProps);
            return {
                mainSubscriberStreamId: streamId,
                streamProperties: newStreamProps,
            };
        });
    };

    handleScrollEnd = (event, subscribers) => {
        console.log('handleScrollEnd', event.nativeEvent); // event.nativeEvent.contentOffset.x
        console.log('handleScrollEnd - events', event.target); // event.nativeEvent.contentOffset.x
        let firstVisibleIndex;
        if (
            event &&
            event.nativeEvent &&
            !isNaN(event.nativeEvent.contentOffset.x)
        ) {
            firstVisibleIndex = parseInt(
                event.nativeEvent.contentOffset.x / (dimensions.width / 2),
                10,
            );
            console.log('firstVisibleIndex', firstVisibleIndex);
        }
        this.setState((prevState) => {
            const newStreamProps = {...prevState.streamProperties};
            if (firstVisibleIndex !== undefined && !isNaN(firstVisibleIndex)) {
                for (let i = 0; i < subscribers.length; i += 1) {
                    if (i === firstVisibleIndex || i === firstVisibleIndex + 1) {
                        newStreamProps[subscribers[i]] = {
                            ...prevState.streamProperties[subscribers[i]],
                        };
                        newStreamProps[subscribers[i]].subscribeToVideo = true;
                    } else {
                        newStreamProps[subscribers[i]] = {
                            ...prevState.streamProperties[subscribers[i]],
                        };
                        newStreamProps[subscribers[i]].subscribeToVideo = false;
                    }
                }
            }
            return {streamProperties: newStreamProps};
        });
    };

    renderSubscribers = (subscribers) => {
        console.log('renderSubscribers', subscribers);
        console.log('this.state.subscriberIds', this.state.subscriberIds);
        console.log(
            'this.state.mainSubscriberStreamId',
            this.state.mainSubscriberStreamId,
        );
        if (this.state.mainSubscriberStreamId) {
            subscribers = subscribers.filter(
                (sub) => sub !== this.state.mainSubscriberStreamId,
            );
            subscribers.unshift(this.state.mainSubscriberStreamId);
        }
        console.log('renderSubscribers - sorted', subscribers);
        return subscribers.length > 1 ? (
            <>
                <View style={styles.mainSubscriberStyle}>
                    <TouchableOpacity
                        onPress={() =>
                            this.handleSubscriberSelection(subscribers, subscribers[0])
                        }
                        key={subscribers[0]}>
                        <OTSubscriberView
                            streamId={subscribers[0]}
                            style={{
                                width: '100%',
                                height: '100%',
                            }}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.secondarySubscribers}>
                    <ScrollView
                        horizontal={true}
                        decelerationRate={0}
                        snapToInterval={dimensions.width / 2}
                        snapToAlignment={'center'}
                        onScrollEndDrag={(e) =>
                            this.handleScrollEnd(e, subscribers.slice(1))
                        }
                        style={{
                            width: dimensions.width,
                            height: dimensions.height / 4,
                        }}>
                        {subscribers.slice(1).map((streamId) => (
                            <TouchableOpacity
                                onPress={() =>
                                    this.handleSubscriberSelection(subscribers, streamId)
                                }
                                style={{
                                    width: dimensions.width / 2,
                                    height: dimensions.height / 4,
                                }}
                                key={streamId}>
                                <OTSubscriberView
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                    }}
                                    key={streamId}
                                    streamId={streamId}
                                />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </>
        ) : subscribers.length > 0 ? (
            <TouchableOpacity style={styles.fullView}>
                <OTSubscriberView
                    streamId={subscribers[0]}
                    key={subscribers[0]}
                    style={{width: '100%', height: '100%'}}
                />
            </TouchableOpacity>
        ) : (
            <Text>No one connected</Text>
        );
    };

    videoView = () => {
        console.log("Getting into viewView ...");
        return (
            <>
                <View style={styles.fullView}>
                    <OTSession
                        apiKey={this.apiKey}
                        sessionId={this.sessionId}
                        token={this.token}
                        eventHandlers={this.sessionEventHandlers}
                        options={{enableStereoOutput: true}}>
                        <OTPublisher
                            properties={this.publisherProperties}
                            eventHandlers={this.publisherEventHandlers}
                            style={styles.publisherStyle}
                        />
                        <OTSubscriber
                            style={{height: dimensions.height, width: dimensions.width}}
                            eventHandlers={this.subscriberEventHandlers}
                            streamProperties={this.state.streamProperties}>
                            {this.renderSubscribers}
                        </OTSubscriber>
                    </OTSession>
                </View>

                <View style={styles.buttonView}>
                    <Icon.Button
                        style={styles.iconStyle}
                        backgroundColor="#131415"
                        name={this.state.localPublishAudio ? 'mic' : 'mic-off'}
                        onPress={this.toggleAudio}
                    />
                    <Icon.Button
                        style={styles.iconStyle}
                        backgroundColor="#131415"
                        name="call-end"
                        onPress={this.endCall}
                    />
                    <Icon.Button
                        style={styles.iconStyle}
                        backgroundColor="#131415"
                        name={this.state.localPublishVideo ? 'videocam' : 'videocam-off'}
                        onPress={this.toggleVideo}
                    />
                </View>
            </>
        );
    };

    joinVideoCall = () => {
        console.log("entering into joinVideoCall ");
        return (
            <SafeAreaView style={styles.fullView}>
                <Button
                    onPress={this.joinCall}
                    title="JoinCall--Mani2-New"
                    color="#841584"
                    accessibilityLabel="Join call">
                    Join Call
                </Button>

            </SafeAreaView>
        );
    };

    render() {
        console.log("joinCall State : " +this.state.joinCall );
        return this.state.joinCall ? this.videoView() : this.joinVideoCall();
    }
}
const styles = StyleSheet.create({
    buttonView: {
        height: 50,
        backgroundColor: '#fff', //'#131415' Vonage Black
        display: 'flex',
        width: '100%',
        position: 'absolute',
        bottom: 0,
        left: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignContent: 'center',
    },
    iconStyle: {
        fontSize: 34,
        paddingTop: 15,
        paddingLeft: 40,
        paddingRight: 40,
        paddingBottom: 15,
        /* borderRadius: 50 */
    },
    fullView: {
        flex: 1,
    },
    scrollView: {
        // backgroundColor: Colors.lighter,
    },
    footer: {
        // color: Colors.dark,
        fontSize: 12,
        fontWeight: '600',
        padding: 4,
        paddingRight: 12,
        textAlign: 'right',
    },
    publisherStyle: {
        width: 100,
        height: 100,
        position: 'absolute',
        top: 5,
        right: 5,
        zIndex: 5,
    },
    mainSubscriberStyle: {
        height: (dimensions.height * 3) / 4 - 50,
    },
    secondarySubscribers: {
        height: dimensions.height / 4,
    },
});
export default App;
