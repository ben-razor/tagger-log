'use strict';function _createForOfIteratorHelper(a,b){var c;if("undefined"==typeof Symbol||null==a[Symbol.iterator]){if(Array.isArray(a)||(c=_unsupportedIterableToArray(a))||b&&a&&"number"==typeof a.length){c&&(a=c);var d=0,e=function(){};return{s:e,n:function n(){return d>=a.length?{done:!0}:{done:!1,value:a[d++]}},e:function e(a){throw a},f:e}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var f,g=!0,h=!1;return{s:function s(){c=a[Symbol.iterator]()},n:function n(){var a=c.next();return g=a.done,a},e:function e(a){h=!0,f=a},f:function f(){try{g||null==c.return||c.return()}finally{if(h)throw f}}}}function _unsupportedIterableToArray(a,b){if(a){if("string"==typeof a)return _arrayLikeToArray(a,b);var c=Object.prototype.toString.call(a).slice(8,-1);return"Object"===c&&a.constructor&&(c=a.constructor.name),"Map"===c||"Set"===c?Array.from(a):"Arguments"===c||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(c)?_arrayLikeToArray(a,b):void 0}}function _arrayLikeToArray(a,b){(null==b||b>a.length)&&(b=a.length);for(var c=0,d=Array(b);c<b;c++)d[c]=a[c];return d}var taggerlog=taggerlog||{};(function(a){function b(b){var c=[{text:"This is an entry with some tags. Tap it to edit or delete.",tags:["getting-started","entries"]},{text:"The tags panel has the tags from all your entries. Clicking a tag makes it green and ACTIVE.",tags:["getting-started","tags"]},{text:"Only entries matching active tags are displayed.\n\nActive tags are automatically added to new entries.",tags:["getting-started","tags","entries"]},{text:"Holding a tag turns it red, making it EXCLUDED.\n\nEntries tagged with excluded tags are not displayed.",tags:["getting-started","tags","entries"]},{text:"This is demo application. Any entries will be lost!",tags:["warning","this-is-a-demo"]}];return new Promise(function(d){for(var e=[],f=c.length,g=a.db.batch(),h=0;h<f;h++){var j=c[h],k=j.text,l=j.tags,m={uid:b.uid,entry:k,date:new Date(Date.now()+100*(f-h)),"tag-list":l,"date-modified":firebase.firestore.FieldValue.serverTimestamp(),deleted:!1},n=a.db.collection("diary-entry").doc();g.set(n,m),e=e.concat(l)}g.commit().then(function(){e=a.processTagList(e),a.db.collection("diary-tags").doc(b.uid).set({tags:e.join()}).then(function(){d()})})})}a.loggedInUser=null;var c={apiKey:"AIzaSyBB82hE6xrDRnr7e_wnftgQwrbOWrbhgcs",authDomain:"diarystore.firebaseapp.com",projectId:"diarystore",storageBucket:"diarystore.appspot.com",messagingSenderId:"719415357807",appId:"1:719415357807:web:9d7542eb704b4bc430f89a"},d=!1;a.TLInterfaceFirebase=function(a){var e=this;this.init=function(){firebase.initializeApp(c),a.db=firebase.firestore(),"localhost"===location.hostname&&(a.db.useEmulator("localhost",8080),firebase.auth().useEmulator("http://localhost:9099/")),firebase.firestore().enablePersistence().catch(function(b){"failed-precondition"!=b.code&&"unimplemented"!=b.code,a.util.logError(b.message)});var e=setTimeout(function(){a.init()},2e3);firebase.auth().onAuthStateChanged(function(c){a.loggedInUser=c,clearTimeout(e),d?(b(c).then(function(){a.init()}),d=!1):a.init()})},this.logIn=function(){var b=new firebase.auth.GoogleAuthProvider;b.setCustomParameters({prompt:"select_account"}),firebase.auth().signInWithPopup(b).then(function(a){a.additionalUserInfo.isNewUser&&(d=!0)}).catch(function(b){a.util.logError(b)})},this.logOut=function(){firebase.auth().signOut()},this.deleteEntry=function(b){var c=a.db;c.collection("diary-entry").doc(b).get().then(function(d){var f=d.data(),g=f["tag-list"];c.collection("diary-entry").doc(b).update({deleted:!0,"date-modified":firebase.firestore.FieldValue.serverTimestamp()}).then(function(){e.findOrphanTags(g).then(function(b){b.length&&(a.allTags=a.allTags.filter(function(a){return!b.includes(a)}),a.queryTags=a.queryTags.filter(function(a){return!b.includes(a)}),e.saveTags())})}).catch(function(b){a.util.logError(b),a.showAlert("entry-delete-failed-alert")})}).catch(function(b){a.util.logError(b)})},this.addEntry=function(b){var c=JSON.parse(b),d=a.db;c["date-modified"]=this.getCurrentTimestamp(),c.date=new Date(c.date);var e=d.batch(),f=d.collection("diary-entry").doc(),g=d.collection("diary-tags").doc(a.loggedInUser.uid);return e.set(f,c),e.set(g,{tags:a.allTags.join()}),e.commit().catch(function(b){a.entryFailedUpdateUI(b)}),f.id},this.entryFromJSON=function(a){var b=JSON.parse(a);return b.date=new Date(b.date),b["date-modified"]&&(b["date-modified"]=new Date(b["date-modified"])),b},this.editEntry=function(b,c,d){var f=a.db,g=this.entryFromJSON(c),h=this.entryFromJSON(d),i=g["tag-list"].filter(function(a){return!h["tag-list"].includes(a)});h["date-modified"]=firebase.firestore.FieldValue.serverTimestamp(),f.collection("diary-entry").doc(b).update(h).then(function(){e.findOrphanTags(i).then(function(b){b.length&&(a.allTags=a.allTags.filter(function(a){return!b.includes(a)}),a.queryTags=a.queryTags.filter(function(a){return!b.includes(a)}),e.getEntries()),e.saveTags()}),a.updateQueryRelatedTags(),a.refreshEntryDisplay()}).catch(function(b){a.util.logError(b),a.showAlert("entry-edit-failed-alert")})},this.saveTags=function(){var b=a.loggedInUser,c=a.db;c.collection("diary-tags").doc(b.uid).set({tags:a.allTags.join()}).then(function(){a.saveTagsRefresh()}).catch(function(b){a.util.logError(b)})},this.findOrphanTags=function(b){var c=a.db,d=[];return new Promise(function(e,f){if(b.length){var g=new Set,h=c.collection("diary-entry");h=h.where("uid","==",a.loggedInUser.uid),h=h.where("tag-list","array-contains-any",b),h.get({source:"cache"}).then(function(a){a.forEach(function(a){var b=a.data();if(!b.deleted){var c,d=_createForOfIteratorHelper(b["tag-list"]);try{for(d.s();!(c=d.n()).done;){var e=c.value;g.add(e)}}catch(a){d.e(a)}finally{d.f()}}}),d=b.filter(function(a){return!g.has(a)}),e(d)}).catch(function(a){f(a)})}else e(d)})},this.getEntries=function(b){var c=a.db,d=a.loggedInUser;if(b)console.log("Full reload!!"),this.getEntriesFromServer(null,a.queryTags);else{var f=c.collection("diary-entry").orderBy("date","desc");f=f.where("uid","==",d.uid),f=f.where("deleted","==",!1),f=0<a.queryTags.length?f.where("tag-list","array-contains-any",a.queryTags):f.limit(10),a.entries=[],a.queryRelatedTags=[],f.get({source:"cache"}).then(function(b){var c=null;b.forEach(function(b){var d=b.data();d.id=b.id,d.date=d.date.toDate(),d["date-modified"]=d["date-modified"].toDate(),a.insertEntry(d),(!c||d["date-modified"].getTime()>c.getTime())&&(c=d["date-modified"])}),a.updateQueryRelatedTags(),a.refreshUI(),e.getEntriesFromServer(c)}).catch(function(b){a.util.logObject(b)})}},this.getEntriesFromServer=function(b,c){var d=a.db,e=a.loggedInUser,f=d.collection("diary-entry").orderBy("date-modified","desc");f=f.where("uid","==",e.uid),b&&(f=f.where("date-modified",">",b)),c&&0<c.length&&(f=f.where("tag-list","array-contains-any",c)),f.get({source:"server"}).then(function(b){b.size&&(b.forEach(function(b){var c=b.data();c.id=b.id,c.date=c.date.toDate(),c["date-modified"]=c["date-modified"].toDate(),a.insertEntry(c)}),a.updateQueryRelatedTags(),a.refreshUI()),a.refreshUI()})},this.getTags=function(){var b=a.db;b.collection("diary-tags").doc(a.loggedInUser.uid).get().then(function(c){var d=c.data(),e=d.tags;a.setAllTags(e),b.collection("diary-tag-combos").doc(a.loggedInUser.uid).get().then(function(b){var c=b.data();c&&a.setTagCombos(c["tag-combos"])})})},this.saveTagCombos=function(){var b=a.loggedInUser,c=a.db;c.collection("diary-tag-combos").doc(b.uid).set({"tag-combos":a.tagCombos}).catch(function(b){a.util.logObject(b)})},this.getCurrentTimestamp=function(){return firebase.firestore.FieldValue.serverTimestamp()}}})(taggerlog);