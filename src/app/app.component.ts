import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import firebase from 'firebase/app';
import { Viewer } from './models/Viewer.model';
import { Game } from './models/Game.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  login = '';
  password = '';
  newViewerNickname = '';

  resultViewerNickname = '';
  resultPoints!: number | null;
  resultGame = '';
  resultViewerError = '';
  resultGameError = '';

  private viewerToUpdate!: AngularFirestoreDocument<Viewer> | null;
  private gameToUpdate!: AngularFirestoreDocument<Game> | null;


  viewers!: Viewer[];
  games!: Game[];

  connectedUser!: firebase.User | null;

  private gamesCollection!: AngularFirestoreCollection<Game>;
  private viewersCollection!: AngularFirestoreCollection<Viewer>;

  private userConnectionSubscription!: Subscription;
  private viewersSubscription!: Subscription;
  private gamesSubscription!: Subscription;

  constructor(private firestore: AngularFirestore, private fireauth: AngularFireAuth) { }

  ngOnInit() {
    this.gamesCollection = this.firestore.collection<Game>('games');
    this.viewersCollection = this.firestore.collection<Viewer>('viewers', viewer => viewer.orderBy('totalPoints', 'desc').orderBy('nickname'));
    this.subscribeToUserConnection();
    this.subscribeToViewers();
    this.subscribeToGames();
  }

  private subscribeToUserConnection() {
    this.userConnectionSubscription = this.fireauth.user.subscribe(connectedUser => {
      this.connectedUser = connectedUser;
      console.log('connected user : ', this.connectedUser);
    });
  }

  private subscribeToViewers() {
    this.viewersSubscription = this.viewersCollection.valueChanges({idField: 'viewerId'}).subscribe(viewers => {
      console.log('viewers : ', viewers);
      this.viewers = viewers;
    });
  }

  private subscribeToGames() {
    this.gamesSubscription = this.gamesCollection.valueChanges({idField: 'gameId'}).subscribe(games => {
      this.games = games;
      console.log(this.games);
    });
  }

  ngOnDestroy() {
    this.userConnectionSubscription.unsubscribe();
    this.viewersSubscription.unsubscribe();
    this.gamesSubscription.unsubscribe();
  }

  addViewer() {
    this.viewersCollection.add({nickname: this.newViewerNickname, results: [], totalPoints: 0});
    this.newViewerNickname = '';
  }

  addResult() {
    this.resultViewerError = '';
    this.resultGameError = '';
    // get the view
    const viewer = _.find(this.viewers, {nickname: this.resultViewerNickname});
    if (!viewer) {
      this.resultViewerError = 'Le viewer n\'existe pas';
    }
    const game = _.find(this.games, {name: this.resultGame});
    if (!game) {
      this.resultGameError = 'Le jeu n\'existe pas';
    }
    console.log(this.resultPoints);
    if (viewer && game) {
      // we can do the update
      // get ref of element we will update
      this.gameToUpdate = this.firestore.doc<Game>(`games/${game.gameId}`);
      this.viewerToUpdate = this.firestore.doc<Viewer>(`viewers/${viewer.viewerId}`);

      // update the viewer
      const viewerToSend = {...viewer};
      // we have to delete the viewerId otherwise the field will be saved in firestore (we do not want that)
      delete viewerToSend.viewerId;
      //   add the points
      viewerToSend.totalPoints += this.resultPoints || 1;
      //   add the result
      viewerToSend.results.push({
        answerDate: new Date(),
        points: this.resultPoints || 1,
        game: this.gameToUpdate.ref
      });
      
      this.viewerToUpdate.update(viewerToSend);

      // update the game
      const gameToSend = {...game};
      // we have to delete the gameId otherwise the field will be saved in firestore (we do not want that)
      delete game.gameId;
      gameToSend.askedQuestionsNumber++;
      this.gameToUpdate.update(gameToSend);

      // reset values
      this.resultViewerNickname = '';
      this.resultGame = '';
      this.resultPoints = null;
      this.gameToUpdate = null;
      this.viewerToUpdate = null;
    }
  }

  doLogin() {
    // call firebase to login
    this.fireauth.signInWithEmailAndPassword(this.login, this.password);
    this.login = '';
    this.password = '';
  }

  doLogout() {
    // call firebase to logout
    this.fireauth.signOut();
  }
}
