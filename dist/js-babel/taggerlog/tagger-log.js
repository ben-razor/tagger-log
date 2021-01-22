'use strict';function _createForOfIteratorHelper(a,b){var c;if("undefined"==typeof Symbol||null==a[Symbol.iterator]){if(Array.isArray(a)||(c=_unsupportedIterableToArray(a))||b&&a&&"number"==typeof a.length){c&&(a=c);var d=0,e=function(){};return{s:e,n:function n(){return d>=a.length?{done:!0}:{done:!1,value:a[d++]}},e:function e(a){throw a},f:e}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var f,g=!0,h=!1;return{s:function s(){c=a[Symbol.iterator]()},n:function n(){var a=c.next();return g=a.done,a},e:function e(a){h=!0,f=a},f:function f(){try{g||null==c.return||c.return()}finally{if(h)throw f}}}}function _unsupportedIterableToArray(a,b){if(a){if("string"==typeof a)return _arrayLikeToArray(a,b);var c=Object.prototype.toString.call(a).slice(8,-1);return"Object"===c&&a.constructor&&(c=a.constructor.name),"Map"===c||"Set"===c?Array.from(a):"Arguments"===c||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(c)?_arrayLikeToArray(a,b):void 0}}function _arrayLikeToArray(a,b){(null==b||b>a.length)&&(b=a.length);for(var c=0,d=Array(b);c<b;c++)d[c]=a[c];return d}var taggerlog=taggerlog||{};(function(a){function b(){H(),J()}function c(b,c){c===void 0&&(c="entry-error");var d=b.reason,e=$("#text-entry-error-"+d).html(),f=a.tagErrorConfig[d];if(f){var g=f.data;if(g)for(var h in g)e=e.replaceAll("{"+h+"}",g[h])}var i=$("#"+c+"-alert"),j=$("#"+c+"-text");j.html(e),i.fadeTo(2e3,1e3).delay(2e3).slideUp(500)}function d(a){var b=$("#text-"+a).html(),c=$("#entry-alert"),d=$("#entry-alert-text");d.html(b),c.fadeTo(2e3,1e3).slideUp(500)}function e(a){this.reason=a}function f(b){var c=a.loggedInUser,f=a.db,h=$("#add-entry-spinner"),i=$("#diary-submit");h.show(),i.prop("disabled",!0);var j=$(b),k=j.find("textarea[name=diary-entry]"),n=k.val().substring(0,K["max-length"]),o=j.find("[name=diary-date]").val(),p=[];n||p.push(new e("entry-empty"));var q=j.find("[name=new-tag]"),r=q.val(),s=a.tagCSVToTags(r,!1);s=s.concat(L);var t=new a.TagVerifier(a.tagErrorConfig);if(t.verifyTags(s),t.errors.length&&(p=p.concat(t.errors)),p.length)g(p,h,i);else{s=a.cleanTags(s),s=u(s);var v=s.join();a.allTags=a.allTags.concat(s),a.allTags=u(a.allTags);var A=new Date;o&&""!==o&&(A=new Date(o));var w={uid:c.uid,entry:n,date:new Date(A),tags:v,"tag-list":s,"date-modified":firebase.firestore.FieldValue.serverTimestamp()},x=f.batch(),y=f.collection("diary-entry").doc(),z=f.collection("diary-tags").doc(c.uid);x.set(y,w),x.set(z,{tags:a.allTags.join()}),x.commit().then(function(){w.id=y.id,a.entries.unshift(w),l(),m(a.entries),h.hide(),i.prop("disabled",!1),d("entry-added-alert"),k.val("")}).catch(function(a){g(a)})}}function g(b,d,e){var d=$("#add-entry-spinner"),e=$("#diary-submit"),f=b[0].reason;a.util.logError("Error adding document: "+f),d.hide(),e.prop("disabled",!1),c(b[0])}function h(b){var d=$("#edit-entry-spinner"),e=$("#edit-entry-button");a.util.logError(JSON.stringify(b)),d.hide(),e.prop("disabled",!1),c(b[0],"edit-error")}function i(){var b=a.loggedInUser,c=a.db;return new Promise(function(d,e){c.collection("diary-tags").doc(b.uid).set({tags:a.allTags.join()}).then(function(){d()}).catch(function(a){e("Error adding tags: "+a.toString())})})}function j(b){var c=a.loggedInUser,d=a.db,e=d.collection("diary-entry");e=e.where("uid","==",c.uid);var f=[],g=[];return new Promise(function(a,c){0<b.length&&(e=e.where("tag-list","array-contains-any",b)),e.get().then(function(c){c.forEach(function(a){var c,d=a.data(),e=d["tag-list"],g=_createForOfIteratorHelper(e);try{for(g.s();!(c=g.n()).done;){var h=c.value;!f.includes(h)&&b.includes(h)&&f.push(h)}}catch(a){g.e(a)}finally{g.f()}});var d,e=_createForOfIteratorHelper(b);try{for(e.s();!(d=e.n()).done;){var h=d.value;f.includes(h)||g.push(h)}}catch(a){e.e(a)}finally{e.f()}a(g)}).catch(function(a){c(a)})})}function k(){var b=a.loggedInUser,c=a.db,d=c.collection("diary-entry").orderBy("date","desc");d=d.where("uid","==",b.uid);var e=!1;return 0<L.length?(d=d.where("tag-list","array-contains-any",L),e=!0):d=d.limit(10),a.entries=[],N=[],new Promise(function(e){d.get({source:"cache"}).then(function(f){var g=new Date(1955,10,21,6,15,0);f.forEach(function(b){var c=b.data();c.id=b.id,a.entries.push(c),c["date-modified"]>g&&(g=c["date-modified"])}),l(),m(a.entries),d=c.collection("diary-entry").orderBy("date-modified","desc"),d=d.where("uid","==",b.uid),a.entries.length&&(d=d.where("date-modified",">",g)),d.get({source:"server"}).then(function(b){b.size&&(b.forEach(function(b){var c=b.data();c.id=b.id,a.entries.push(c)}),a.entries.sort(function(c,a){return c.date<a.date?1:-1}),l()),e(a.entries)})}).catch(function(b){a.util.logError(["Error getting documents: ",b]),e(a.entries)})})}function l(){N=[];for(var b=0<L.length,c=0;c<a.entries.length;c++){var d=a.entries[c],e=d["tag-list"],f=!0;b&&!L.every(function(a){return 0<=e.indexOf(a)})&&(f=!1),f&&b&&(N=N.concat(e))}return b&&(N=u(N)),N}function m(a){n(a),x(),H()}function n(b){for(var c="<div class=\"diary-entries\">{rows}</div>",d=$("#elem-no-entries").html(),e=$("#elem-no-entries-for-tags").html(),f="",g=0<L.length,h=0<M.length,j=0;j<b.length;j++){var k=b[j],l=a.cleanTags(k["tag-list"]),m=l.join(),n=!0;if(g&&!L.every(function(a){return 0<=l.indexOf(a)})&&(n=!1),h&&l.some(function(a){return 0<=M.indexOf(a)})&&(n=!1),n){var t="<div class=\"diary-entry\" onclick=\"taggerlog.entryClicked('{entry-id}')\">\n      <div class=\"diary-entry-text\">{entry}</div>\n      <div>\n        <div class=\"row\">\n          <div class=\"diary-entry-controls col-3\"></div>\n          <div class=\"diary-entry-tags col-9 text-truncate\">{tags}</div>\n        </div>\n      </div>\n    </div>".replace("{date}",k.date);t=t.replace("{entry}",s(p(k.entry))),t=t.replace("{entry-id}",k.id),t=t.replace("{tags}",m),f+=t}}var o=0<L.length||0<M.length;""==f&&(o?f=e:f=d);var q=c.replace("{rows}",f),r=$("#recent-entries");r.html(q)}function o(a){return a=new Option(a).innerHTML,a}function p(a){return a=o(a),a}function q(a){return a=DOMPurify.sanitize(a),a=a.replace(/[\r\n\t]/g,""),a}function r(a){var b=a.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);return null!==b}function s(a){return a=a.replace(/^(http.*)$/gm,function(a){if(r(a)){var b="<a href=\"{link}\" target=\"_blank\" onclick=\"event.stopPropagation();\">{linkDisplay}</a>".replace("{link}",a);return b=b.replace("{linkDisplay}",a),b}return a}),a=a.replaceAll("*","&bull;"),a=a.replaceAll("\n","<br />"),a}function t(b){var c=a.db;c.collection("diary-entry").doc(b).get().then(function(c){var d=c.data(),e=$("#edit-entry-form"),f=e.find("textarea[name=diary-entry]"),g=e.find("[name=diary-date]");f.val(d.entry);var h=d.date,j=new Date(1e3*h.seconds);g[0].valueAsNumber=j.getTime(),$("#edit-entry-button").data("id",b),$("#delete-entry-button-on-popup").data("id",b);for(var k=d["tag-list"],l=$("#elem-diary-tag-edit").html(),m="",n="",o=0;o<k.length;o++)m=l.replaceAll("{tag}",a.cleanTag(k[o])),m=m.replace("{selected}","selected"),n+=m;$("#diary-edit-entry-tags").html(n),e.find("[name=new-tag]").val(""),$("#edit-entry-date").removeClass("show"),$("#editEntryModal").on("shown.bs.modal",function(){$("#editEntryModal").find("[name=diary-entry]").focus()}),G(),$("#editEntryModal").modal()}).catch(function(b){a.util.logError(b)})}function u(a){for(var b=new Set(a),c=Array.from(b).sort(),d=a.length-1;0<=d;d--)""==c[d]&&c.splice(d,1);return c}function v(){var b=a.db;return new Promise(function(c){b.collection("diary-tags").doc(a.loggedInUser.uid).get().then(function(d){var e=d.data(),f=e.tags;a.allTags=f?u(f.split(",")):[],b.collection("diary-tag-combos").doc(a.loggedInUser.uid).get().then(function(b){var d=b.data();d&&(a.tagCombos=d["tag-combos"]),c()})})})}function w(b,c){var d=L.indexOf(b),e=-1!=d,f=M.indexOf(b),g=-1!=f,h=L[0];c?(e&&L.splice(d,1),g?M.splice(f,1):M.push(b)):(!e&&!g&&L.push(b),e&&L.splice(d,1),g&&M.splice(f,1));var i=L[0],j=a.entries.length&&i===h;l(),I(),j?m(a.entries):k().then(function(){m(a.entries)})}function x(){var b=$("#elem-diary-tag").html(),c=$("#elem-diary-tag-display").html(),d="",e="",f=[],g="",h=a.allTags;N.length&&(h=N),7<h.length-L.length?($(".tl-header-search-container").removeClass("d-none"),O&&(h=h.filter(function(a){return a.startsWith(O.toLowerCase())}))):($(".tl-header-search-container").addClass("d-none"),I());var j=$("#elem-no-tags").html();if(a.loggedInUser){var k=a.loggedInUser.uid;y("query-tags-"+k,L),y("exclude-tags-"+k,M)}for(var l="",m="",n=0;n<L.length;n++)l=c.replaceAll("{tag}",a.cleanTag(L[n])),l=l.replace("{selected}","selected"),m+=l;$("#diary-entry-active-tags").html(m);for(var o,p="",r=h.length,n=0;n<L.length;n++)o=a.cleanTag(L[n]),g=b.replaceAll("{tag}",o),g=g.replaceAll("{selected}","selected"),e+=g,f.push(o);for(var o,n=0;n<M.length;n++)o=a.cleanTag(M[n]),g=b.replaceAll("{tag}",a.cleanTag(o)),g=g.replaceAll("{selected}","exclude"),e+=g,f.push("!"+o);var s=f.join(",");if(f.length&&(a.tagCombos.find(function(a){return a.tags===s})?$("#star-tags-main").addClass("starred"):$("#star-tags-main").removeClass("starred")),h.length){var t,u=_createForOfIteratorHelper(h);try{for(u.s();!(t=u.n()).done;){var o=t.value;if(!(-1<L.indexOf(o)||-1<M.indexOf(o))){var v=!L.length&&!M.length;v&&7<r&&p&&o.charAt(0)!=p.charAt(0)&&(d+="<br />"),g=b.replaceAll("{tag}",a.cleanTag(o)),g=g.replaceAll("{selected}",""),d+=g,p=o}}}catch(a){u.e(a)}finally{u.f()}}else d=j;var x=$("#panel-all-tags").addClass("d-none"),z=$("#panel-selected-tags").addClass("d-none"),A=$("#panel-related-tags").addClass("d-none"),B=$("#diary-related-tags");e?(z.removeClass("d-none"),$("#diary-selected-tags").html(e),$("#diary-tags").html(""),d&&(A.removeClass("d-none"),B.html(d))):(x.removeClass("d-none"),$("#diary-tags").html(d));var C=$("#panel-tag-combos").addClass("d-none"),D=$("#diary-tag-combos");if(a.tagCombos.length){for(var E="",F=$("#elem-diary-tag-combos").html(),n=0;n<a.tagCombos.length;n++){var G=a.tagCombos[n].tags,H=a.tagCombos[n].title,J=F.replaceAll("{tag}",G);J=J.replaceAll("{tag-string}",q(H)),J=G===s?J.replaceAll("{active}","active"):J.replaceAll("{active}",""),E+=J}D.html(E),C.removeClass("d-none")}$(".diary-tag").HoldButton(250,function(a){var b=a.data("tag");w(b,!0)},function(a){var b=a.data("tag");w(b)})}function y(b,c){if(a.loggedInUser){var d=a.loggedInUser.uid;window.localStorage.setItem(d+b,JSON.stringify(c))}}function z(b){if(a.loggedInUser){var c=a.loggedInUser.uid;return window.localStorage.getItem(c+b)}}function A(){$("#diary-controls-toggle").removeClass("d-none").addClass("d-flex"),$("#diary-controls").removeClass("d-flex").addClass("d-none")}function B(){$("#diary-controls-toggle").addClass("d-none").removeClass("d-flex"),$("#diary-controls").removeClass("d-none").addClass("d-flex")}function C(a){var b=$("#"+a),c=b.find(".diary-tag"),d=[];c.each(function(){var a=$(this),b=a.data("tag");a.hasClass("exclude")&&(b="!"+b),d.push(b)});var e=d.join(",");return e}function D(){var b=a.loggedInUser,c=a.db;return new Promise(function(d,e){c.collection("diary-tag-combos").doc(b.uid).set({"tag-combos":a.tagCombos}).then(function(){d()}).catch(function(a){e("Error adding tags: "+a.toString())})})}function E(b){var c=$(b),d=c.data("tag"),e=d.split(","),f=L[0],g=!1;if(c.hasClass("active"))M=[],L=[],c.removeClass("active"),$(".selected-tags-star").removeClass("starred");else{L=[],M=[];for(var h,j=0;j<e.length;j++)h=e[j],h.startsWith("!")?M.push(h.substring(1)):L.push(h);var n=L[0];g=a.entries.length&&n===f}I(),l(),g?m(a.entries):k().then(function(){m(a.entries)})}function F(a){var b=$(a),c=b.data("countElem"),d=$("#"+c),e=b.data("entry-type"),f=[e,"max-length"].join("-"),g=K[f],h=b.val().length;d.removeClass("max warning");h>g-g/10?(d.html(h+"/"+g),d.removeClass("d-none"),h>=g?d.addClass("max"):d.addClass("warning")):d.addClass("d-none")}function G(){var b=$(".entry-count");b.on("change keyup input",function(a){F($(a.target))}),b.each(function(){var b=$(this),c="max-length",d=b.data("entryType");d&&(c=d+"-"+c);var e=a.config[c];b.attr("maxlength",e),F(this)})}function H(){var b=!1;$(".tagAutoComplete").textcomplete([{match:/(^|\b)(,*\w{1,})$/,search:function search(c,d){","===c.charAt(0)&&(b=!0),c=c.replaceAll(",","");var e=a.allTags.filter(function(a){return a.startsWith(c.toLowerCase())}),f=e.length;e=e.slice(0,5),d(e);var g=$(".textcomplete-dropdown");e.length<f&&!g.find(".textcomplete-morematches").length&&g.html(g.html()+"<li class=\"textcomplete-morematches\">...</li>")},template:function template(a){return a},replace:function replace(a,c){var d=$(c.target),e=d.val();return b?(b=!1,","+a+","):a+","}}])}function I(){O="",$(".tl-header-search").val(O)}function J(){I(),$(".tl-header-search").on("input",function(){O=$(this).val().trim(),x()})}var K={"max-length":400,"combo-title-max-length":30,"default-user-img":"img/ui/default-user-1-sm.png"};a.config=K,a.entries=[],a.allTags=[];var L=[],M=[],N=[];a.tagCombos=[];var O="";a.init=function(){a.entries=[],a.allTags=[],a.tagCombos=[],N=[],M=[],L=[],b()},a.showAlert=d,a.showAlert=d,a.diaryAddEntry=f;a.editEntryStart=t,a.editEntry=function(b){var c=a.loggedInUser,f=a.db,g=$("#edit-entry-spinner"),o=$("#edit-entry-button");g.show(),o.prop("disabled",!0);var p=$("#edit-entry-form"),q=p.find("textarea[name=diary-entry]").val().substring(0,K["max-length"]),r=p.find("[name=diary-date]"),s=[];q||s.push(new e("entry-empty"));var t=[],v=[],w=$("#diary-edit-entry-tags").find(".diary-tag");w.each(function(){var a=$(this);a.hasClass("selected")?t.push(a.data("tag")):v.push(a.data("tag"))});var y=p.find("[name=new-tag]"),z=y.val(),A=a.tagCSVToTags(z,!1);A=A.concat(t),A=u(A);var B=new a.TagVerifier(a.tagErrorConfig);if(B.verifyTags(A),B.errors.length&&(s=s.concat(B.errors)),s.length)h(s);else{var C=A.join();a.allTags=a.allTags.concat(A),a.allTags=u(a.allTags);var D={entry:q,date:new Date(r.val()),tags:C,"tag-list":A,"date-modified":firebase.firestore.FieldValue.serverTimestamp()};f.collection("diary-entry").doc(b).update(D).then(function(){for(var c,e=0;e<a.entries.length;e++)if(c=a.entries[e],c.id==b){D.id=b,a.entries[e]=D;break}j(v).then(function(b){b.length&&(a.allTags=a.allTags.filter(function(a){return!b.includes(a)}),L=L.filter(function(a){return!b.includes(a)}),k().then(function(){m(a.entries)})),i().then(function(){x()})}),l(),n(a.entries),g.hide(),o.prop("disabled",!1),$("#editEntryModal").modal("hide"),d("entry-edited-alert")}).catch(function(b){a.util.logError(b),d("entry-edit-failed-alert"),g.hide(),o.prop("disabled",!1),$("#editEntryModal").modal("hide")})}},a.deleteEntryStart=function(b){var c=a.db;c.collection("diary-entry").doc(b).get().then(function(a){a.data()}).catch(function(b){a.util.logError(b)}),$("#delete-entry-button").data("id",b),$("#editEntryModal").modal("hide"),$("#deleteEntryModal").modal()},a.deleteEntry=function(b){var c=a.loggedInUser,e=a.db,f=$("#delete-entry-spinner");f.show();e.collection("diary-entry").doc(b).get().then(function(c){var g=c.data(),h=g["tag-list"];e.collection("diary-entry").doc(b).delete().then(function(){f.hide(),$("#deleteEntryModal").modal("hide"),d("entry-deleted-alert");for(var c,e=0;e<a.entries.length;e++)if(c=a.entries[e],c.id==b){a.entries.splice(e,1);break}n(a.entries),j(h).then(function(b){b.length&&(a.allTags=a.allTags.filter(function(a){return!b.includes(a)}),L=L.filter(function(a){return!b.includes(a)}),i().then(function(){k().then(function(){m(a.entries)})}))})}).catch(function(b){a.util.logError(b),d("entry-delete-failed-alert"),f.hide(),$("#deleteEntryModal").modal("hide")})}).catch(function(b){a.util.logError(b)})},a.processTagList=u,a.toggleTag=w,a.toggleEditTag=function(a){var b=$("#diary-tag-edit-"+a);b.hasClass("selected")?b.removeClass("selected"):b.addClass("selected")},a.updateLoggedInUI=function(){var b=a.loggedInUser;if($(".loading-show").addClass("d-none"),$(".loaded-show").removeClass("d-none"),a.loggedInUser){var c=a.loggedInUser.uid,d=z("query-tags-"+c),e=z("exclude-tags-"+c);d&&(L=JSON.parse(d)),e&&(M=JSON.parse(e)),$(".logged-in-show").removeClass("d-none"),$(".logged-out-show").addClass("d-none");var f=K["default-user-img"];$("#header-user-img").on("error",function(){$(this).attr("src",K["default-user-img"])}),b.photoURL&&(f=b.photoURL),$("#header-user-img").attr("src",f),$("#header-user-name").html(b.displayName),$("#header-user-email").html(b.email),$("#diary-controls").removeClass("d-none").addClass("d-flex");var g=$("input[type=text], textarea");g.focus(function(){A()}),g.on("blur",function(){B()}),$("#diary-controls-toggle").on("click",function(a){a.stopPropagation(),B()}),k().then(function(a){m(a)}),v().then(function(){x()})}else $(".logged-in-show").addClass("d-none"),$(".logged-out-show").removeClass("d-none"),$("#diary-controls").removeClass("d-flex").addClass("d-none")},a.toggleNewEntry=function(){var a=$("#diary-new-entry-panel"),b=$("#diary-tags-panel"),c=$("#diary-entries-panel"),d=$("#diary-control-new-entry"),e=$("#diary-control-tags");a.hasClass("collapse")?(a.removeClass("collapse"),c.removeClass("collapse"),b.addClass("collapse"),d.removeClass("inactive"),e.addClass("inactive"),$("#diary-new-entry").find("[name=diary-entry]").focus()):(a.addClass("collapse"),c.removeClass("collapse"),d.addClass("inactive")),window.scrollTo(0,0)},a.toggleTags=function(){var a=$("#diary-tags-panel"),b=$("#diary-new-entry-panel"),c=$("#diary-control-new-entry"),d=$("#diary-control-tags");a.hasClass("collapse")?(a.removeClass("collapse"),b.addClass("collapse"),c.addClass("inactive"),d.removeClass("inactive")):(a.addClass("collapse"),d.addClass("inactive")),window.scrollTo(0,0)},a.entryClicked=function(a){var b=window.getSelection(),c=b.toString().length;c||t(a)},a.starTagsStart=function(b){var c=$(b),d=c.data("tagsElem"),e=C(d),f=a.tagCombos.find(function(a){return a.tags===e});f===void 0?($("#star-tags-modal").on("shown.bs.modal",function(){$("#star-tags-form").find("[name=title]").val("").focus(),G()}),$("#star-tags-modal").modal()):(a.tagCombos=a.tagCombos.filter(function(a){return a.tags!==e}),D().then(function(){c.removeClass("starred"),x()}))},a.starTags=function(b){var d=$(b),f=d.data("tagsElem"),g=$("#"+f),h=g.find(".diary-tag"),i=$("#star-tags-form").find("[name=title").val(),j=q(i);if(i!==j)c(new e("starred-title-invalid"),"star-tags-error");else if(!i)c(new e("starred-title-empty"),"star-tags-error");else{i=j.trim().substring(0,a.config["combo-title-max-length"]);var k=[];h.each(function(){var a=$(this),b=a.data("tag");a.hasClass("exclude")&&(b="!"+b),k.push(b)});var l=k.join(",");a.tagCombos.unshift({title:i,tags:l}),d.addClass("starred"),D().then(function(){x(),$("#star-tags-modal").modal("hide")})}},a.getTagCombos=function(){return a.tagCombos},a.selectCombo=E,a.entryChanged=F,G(),H(),J()})(taggerlog);