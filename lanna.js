  var current_jid, check_job_timer, current_state;
  var review_photos = { }
  var album_detail = { }
  var div = $('<div></div>');
  var img = $('<img />');
  var p = $('<p />');
  var i = $('<i />');
  var li = $('<li />');
  var h3 = $('<h3 />');
  var span = $('<span />');
  var input= $('<input />');
  var loading ;
  var presets = [];
  var current_preset; 

  var Photo = {
    Album: {
      getAlbums: function(owner_id) {
        var getAlbumsFql = 'SELECT aid, object_id, name, cover_pid, size, link, visible, description, created, modified ' +
                           'FROM album WHERE owner = {0}';
        var getAlbumPhotoFql = 'SELECT aid, pid, src, src_small, src_big, link, caption FROM photo WHERE pid ' +
                               'IN (SELECT cover_pid FROM album WHERE owner = {0}) ORDER BY modified DESC';
        var albums = FB.Data.query(getAlbumsFql, owner_id);

        //a_photos = album_photos
        var a_photos = FB.Data.query(getAlbumPhotoFql, owner_id);

        return {album: albums, a_photo: a_photos};
      },
      getPhotos: function(aid) {
        var getPhotosFql = 'SELECT pid, object_id, src, src_small, src_big, link, created FROM photo ' +
                           'WHERE aid = {0}';

        var photos = FB.Data.query(getPhotosFql, aid);

        return photos;
      }
    },
    get: function(pid) {
      var getPhotoFql = 'SELECT object_id, src, src_small, src_big, link, created FROM photo WHERE pid = {0}';
      var photo = FB.Data.query(getPhotoFql, pid);

      return photo;
    },
    graph: function(object_id) {
      return 'https://graph.facebook.com/'+object_id+'/picture?access_token='+FB._session['access_token'];
    },
    graph_json: function(object_id) {
      return 'https://graph.facebook.com/'+object_id+'?access_token='+FB._session['access_token'];
    }
  }

function repaint() {
  $('.fb-picture-div').removeClass('hover');
  $.each(review_photos, function(k, v) {
    var selector = "img[pid|='" +k + "']";
    $(selector).parent('div').addClass('hover');
  });
}


function getAlbums() {
  var data = Photo.Album.getAlbums(FB.getSession().uid);
  $('#fb-albums').append(loading);

  FB.Data.waitOn([data.album, data.a_photo], function(args) {
    FB.Array.forEach(data.album['value'] , function(detail) {
      album_detail[detail.aid] = detail;
    });

    FB.Array.forEach(data.a_photo['value'] , function(album) {
      var aid = album.aid;
      var detail = album_detail[aid];
      var div_section = li.clone().addClass('fb-album');
      var img_section = div.clone().addClass('fb-thumb').append(img.clone().addClass('album_cover').attr({src: album['src'], id: album['aid'], aid: aid}));
      var cover_section = div_section.append(img_section);


      var div_detail = 	div.clone().addClass('fb-album-detail').append(h3.clone().html(detail['name']));
      div_detail.append(p.clone().html( 'จำนวน ' + detail['size'] +' รูป' ));
      cover_section.append(div_detail);
      $('#fb-albums').append(cover_section);

    });

  loading.remove();
  });
} /// getPhotos


/***  Show All Photos In Album ***/
function showAlbum(aid) {
  var photos = Photo.Album.getPhotos(aid);
  var album_content = $('#album_content');
  var div_img ;
  var album_name = album_detail[aid]['name'];

  $('.album_name').html(album_name);
  $('#fb-photos').append(loading);
  photos.wait(function(photo) {
    FB.Array.forEach(photos['value'], function(photo) {
      var photo = img.clone().attr({src: photo['src'], object_id: photo.object_id, pid: photo.pid, alt: photo['caption']});
      div_img = div.clone().addClass('fb-picture-div');
      div_img.append(photo);
      album_content.append(div_img);
    });
    loading.remove();
    $('#album-photos').append(div.clone().addClass("clear")).append(album_content);
    if ( $('div .hover').size() == 0 ) {
      repaint();
    }
    $( 'html, body' ).animate( { scrollTop: 0 }, 'fast' );
    FB.Canvas.setSize();
  });
} //end showAllbum(id)

function update_review_photo() {
  var n_select = $("#review-photos img.fb-photo-review").size();
  if (current_state == 2 && n_select) {
    $('.go-review-button-wrap').show();
  }
  else {
    $('.go-review-button-wrap').hide();
  }

  if (current_state == 3 && !n_select) {
    $('.go-checkin').hide();
  }
  else {
    $('.go-checkin').show();
  }
}

function set_state(state) {
  current_state = state;
  $('.tab-nav li').hide();
  $('#review-photos button').remove()
  switch(current_state) {
    case 1:
      if ($("#review-photos img.fb-photo-review").size()) {
        $('.go-review-button-wrap').show();
      }
      break;
    case 2:
      $('.show-all-albums-wrap').show();
      if ($("#review-photos img.fb-photo-review").size()) {
        $('.go-review-button-wrap').show();
      }
      $('#show-all-albums-wrap').show();
      $('#fb-albums').hide();
      $('#fb-photos').show();

      break;

    case 3:
      $('.back-all-albums-wrap, .go-checkin-wrap').show();
      $('#fb-albums').hide();
      break;
    case 4:
      $('.start-over-wrap').show();
      break;
    default:
      break;
  }

}

$('.show-all-albums').live('click', function(e) {
  set_state(1);
  $('#fb-photos').hide();
  $('#fb-albums').show();
  $('#album_content').html('');
  $('#review-photos').hide();
  $('#select-photos').show();
  $( 'html, body' ).animate( { scrollTop: 0 }, 'fast' );
});

$('.go-review-button').live('click', function(e) {
  set_state(3);
  $('#review-photos').show();
  $('#fb-photos').hide();
  $('fb-albums').hide();
  $.post("/lanna/process", review_photos, function(data) {
      presets = data;
      $.each(presets, function(k, v) {
         console.log(v.link);
         $('#review-photos').append($('<button />').html(k).attr('id', v.preset));
      });
     
      $('.review-photo p img').eq(0).attr('src', presets[0].link);
      current_preset = presets[0];
   }, "json");
});

$('button').live('click', function(e) {
  var self = $(this);
  var psname = self.eq(0).attr('id');  
  var preset;
  if ( psname && psname in presets['name'] ) {
    preset = presets[presets['name'][psname]]
    current_preset = preset;
    console.log(preset, current_preset, 'cur');
    $('.review-photo p img')[0].src = preset.link;
    
  } 
});

// Click for choose album
$('li.fb-album').live('click', function(e) {
  set_state(2);
  var self = $(this);
  var curr_img = (self.children('.fb-thumb').children('img'));
  FB.Canvas.setSize({height: 0});
  showAlbum(curr_img.attr('id'));
});

// Test it
$('.fb-picture-div').live('click', function(e) {
  var self = $(this);
  self = self.children('img');
  var self_photo = self;
  var photos = Photo.get($(self).attr('pid'));
  $('.fb-picture-div').removeClass('hover');
  self.parent('div').addClass('hover');
  var pic_containner;
	photos.wait(function(photo) {
		FB.api('/'+ photo[0]['object_id'], function(data) {
			var pid = photo[0].pid;
			var picture = p.clone().append(img.clone().attr({src: self_photo.attr('src_big'), id: pid}).addClass('fb-photo-review'));
			pic_containner = div.clone().addClass('review-photo').append(picture);
			if($('.review-photo').size() == 0) {
				$('#review-photos').append(pic_containner);
			}
			else {
				$('.review-photo').remove();
				$('#review-photos').append(pic_containner);
			}
			clear_review_object();
			review_photos[pid] = JSON.stringify(data); 
			update_review_photo();
		});
	}); //end wait
});
function clear_review_object() {
  $.each(review_photos, function(k, v) {
		delete (review_photos[k]);
	});
}

$('.go-checkin').live('click', function(e) {
  console.log(review_photos, 'okay');
  delete(current_preset['link']);
  console.log(current_preset);
  set_state(0);
  var waiting = loading.clone();
  $.post('/lanna/facebook/post/album', {data: JSON.stringify(current_preset)}, function(resp) {
    console.log(resp);
  }, 'json');
  $('#server-result').append(waiting);
  $('#fb-photos').hide();
  $('#fb-albums').hide();
  $('#review-photos').hide();
  $('#server-result').show();
});

$('.start-over').live('click', function(e) {
  window.location.reload();
});

