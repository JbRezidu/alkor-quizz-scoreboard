import { Component, OnDestroy, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'angularApp';

  bestStreamer = '';
  streamers!: { name: (string | undefined); type: string; }[];

  private testCollection!: AngularFirestoreCollection<{ bestStreamer?: string; worstStreamer?: string; }>;

  private collectionSubscription!: Subscription;

  constructor(private firestore: AngularFirestore) { }

  ngOnInit() {
    this.testCollection = this.firestore.collection<{ bestStreamer?: string; worstStreamer?: string }>('Test');
    this.collectionSubscription = this.testCollection.valueChanges().subscribe(newValues => {
      this.streamers = _.sortBy(newValues.map(newValue => ({ name: newValue.bestStreamer || newValue.worstStreamer, type: newValue.bestStreamer ? 'bestStreamer' : 'worstStreamer' })), ['name']);
    });
  }

  ngOnDestroy() {
    this.collectionSubscription.unsubscribe();
  }

  addBestStream() {
    console.log(this.bestStreamer);
    this.testCollection.add({ bestStreamer: this.bestStreamer });
    this.bestStreamer = '';
  }
}
