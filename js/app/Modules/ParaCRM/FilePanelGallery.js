Ext.define('Optima5.Modules.ParaCRM.FilePanelGallery',{
	extend : 'Optima5.Modules.ParaCRM.GalleryWithStore',
			  
	alias : 'widget.op5paracrmfilegallery',
			  
	storeKeyField : 'filerecord_id',

	prepareData: function( data ) {
		var getParams = new Object() ;
		Ext.apply( getParams, {
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_moduleAccount: '',
			media_id: data.filerecord_id,
			thumb: true
		});
		
		Ext.apply(data, {
			thumb_url: 'server/backend_media.php?' + Ext.Object.toQueryString(getParams)
		});
		return data;
	}
});