Ext.define('Optima5.Modules.Spec.RsiRecouveo.EnvPreviewPanel',{
	extend: 'Ext.tab.Panel',
	
	requires: ['Optima5.Modules.Spec.RsiRecouveo.EnvDocPreviewPanel'],
	
	_envFilerecordId: null,
	_envData: null,
	
	initComponent: function() {
		Ext.apply(this,{
			deferredRender: true,
			items:[]
		});
		
		this.callParent() ;
		
		if( this._envFilerecordId ) {
			this.loadEnvelope( this._envFilerecordId ) ;
		} else if( this._envData ) {
			this.onLoadEnvelope( this._envData ) ;
		}
	},
	loadEnvelope: function( envFilerecordId ) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'doc_getEnvGrid',
				filter_envFilerecordId_arr: Ext.JSON.encode([envFilerecordId])
			},
			success: function(response) {
				var ajaxResponse = Ext.JSON.decode(response.responseText) ;
				if( ajaxResponse.success && ajaxResponse.data.length==1 ) {
					this.onLoadEnvelope(ajaxResponse.data[0]) ;
				}
			},
			scope: this
		}) ;
	},
	onLoadEnvelope: function( envData ) {
		this._envFilerecordId = envData.env_filerecord_id ;
		this._envData = envData ;
		
		this.removeAll() ;
		Ext.Array.each( this._envData.docs, function(envDocRow) {
			this.add( Ext.create('Optima5.Modules.Spec.RsiRecouveo.EnvDocPreviewPanel',{
				optimaModule: this.optimaModule,
				_mediaId: envDocRow.envdoc_media_id,
				title: envDocRow.doc_desc
			}) ) ;
		},this) ;
	}
}) ;
