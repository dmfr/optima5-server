Ext.define('Optima5.Modules.Spec.RsiRecouveo.AttachmentsFieldPanel',{
	extend:'Ext.panel.Panel',
	
	mixins: ['Ext.form.field.Field'],
	
	extend:'Ext.panel.Panel',
	
	newTitle: 'Saisie nouveau',
	fieldLabel: 'textfield',
	fieldXtype: 'textfield',
	filterAdrType: '',
	
	store: null,
	
	height: 150,
	border: false,
	
	initComponent: function() {
		this.store = Ext.create('Ext.data.Store',{
			model: 'RsiRecouveoEnvelopeDocumentModel',
			data: [],
			filters: [{
				property: 'is_deleted',
				operator:'eq',
				value: false
			}],
			proxy: {
				type: 'memory',
				reader: {
					type: 'json'
				}
			}
		}) ;
		Ext.apply(this,{
			layout: 'border',
			items: [{
				itemId: 'pNorth',
				region: 'north',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 8,
				height: 125,
				title: this.newTitle,
				collapsible: true,
				collapsed: true,
				xtype: 'panel',
				floatable: false,
				layout: 'fit',
				items: [{
					xtype: 'form',
					border: false,
					bodyCls: 'ux-noframe-bg',
					layout: 'anchor',
					items: [{
						anchor: '100%',
						fieldLabel: 'Description',
						xtype: 'textfield',
						name: 'doc_desc',
						allowBlank: false
					},{
						anchor: '100%',
						xtype: 'filefield',
						emptyText: 'Choisir fichier local',
						fieldLabel: 'Fichier',
						name: 'doc_src',
						buttonText: '',
						buttonConfig: {
							iconCls: 'upload-icon'
						},
						allowBlank: false
					}],
					buttons: [{
						xtype: 'button',
						text: 'OK',
						handler: function( btn ) {
							this.handleUpload() ;
						},
						scope: this
					}]
				}]
			},{
				region: 'center',
				flex: 1,
				xtype: 'grid',
				store: this.store,
				columns: [{
					align: 'center',
					xtype:'actioncolumn',
					width:60,
					disabledCls: 'x-item-invisible',
					items: [{
						icon: 'images/op5img/ico_delete_16.gif',
						tooltip: 'Effacer',
						handler: function(grid, rowIndex, colIndex, item, e) {
							var rec = grid.getStore().getAt(rowIndex);
							this.handleDelete(rec) ;
						},
						scope: this,
						disabledCls: 'x-item-invisible',
						isDisabled: function(view,rowIndex,colIndex,item,record ) {
							return false ;
						}
					},{
						icon: 'images/op5img/ico_edit_small.gif',
						tooltip: 'Visualisation',
						handler: function(grid, rowIndex, colIndex, item, e) {
							var rec = grid.getStore().getAt(rowIndex);
							this.handleView(rec) ;
						},
						scope: this,
						disabledCls: 'x-item-invisible',
						isDisabled: function(view,rowIndex,colIndex,item,record ) {
							return false ;
						}
					}]
				},{
					text: 'Description',
					dataIndex: 'doc_desc',
					flex: 1,
					menuDisabled: true,
					sortable: false,
					renderer: function(value) {
						return Ext.util.Format.nl2br( Ext.String.htmlEncode( value ) ) ;
					}
				},{
					text: 'Pages',
					dataIndex: 'doc_pagecount',
					width: 48,
					menuDisabled: true,
					sortable: false,
					renderer: function(value) {
						return Ext.util.Format.nl2br( Ext.String.htmlEncode( value ) ) ;
					}
				}]
			}]
		});
		this.callParent() ;
	},
	handleDelete: function(gridrecord) {
		// remote delete tmp + local store delete
		var mediaId = gridrecord.getId() ;
		Ext.Msg.confirm('Suppression','Supprimer pièce jointe '+gridrecord.get('doc_desc')+' ?',function(btn) {
			if( btn=='yes' ) {
				this.doDelete(mediaId) ;
			}
		},this) ;
	},
	doDelete: function(mediaId) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'doc_delete',
				envdoc_media_id: Ext.JSON.encode([mediaId])
			},
			success: function(response) {
				if( Ext.JSON.decode(response.responseText).success ) {
					this.store.remove( this.store.getById(mediaId) ) ;
				}
			},
			scope: this
		}) ;
	},
	doDeleteAll: function() {
		var arrMediaIds = [] ;
		this.store.each(function(gridrecord) {
			if( gridrecord.get('envdoc_filerecord_id') ) {
				return ;
			}
			arrMediaIds.push( gridrecord.getId() ) ;
		}) ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'doc_delete',
				envdoc_media_id: Ext.JSON.encode(arrMediaIds)
			},
			success: function(response) {
				if( Ext.JSON.decode(response.responseText).success ) {
					this.store.removeAll() ;
				}
			},
			scope: this
		}) ;
	},
	handleView: function(gridrecord) {
		this.optimaModule.createWindow({
			width:1200,
			height:800,
			resizable:true,
			maximizable:false,
			layout:'fit',
			items:[Ext.create('Optima5.Modules.Spec.RsiRecouveo.EnvDocPreviewPanel',{
				optimaModule: this.optimaModule,
				_mediaId: gridrecord.getId()
			})]
		}) ;
	},
	
	handleUpload: function() {
		var formPanelCnt = this.down('#pNorth'),
			formPanel = formPanelCnt.down('form'),
			form = formPanel.getForm() ;
		if(form.isValid()){
			var ajaxParams = this.optimaModule.getConfiguredAjaxParams() ;
			Ext.apply( ajaxParams, {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'doc_uploadFile'
			}) ;
			
			var msgbox = Ext.Msg.wait('Uploading document...');
			form.submit({
				url: Optima5.Helper.getApplication().desktopGetBackendUrl(),
				params: ajaxParams,
				success : function(form,action){
					msgbox.close() ;
					Ext.menu.Manager.hideAll();
					var ajaxData = Ext.JSON.decode(action.response.responseText).data ;
					this.onAfterUpload( ajaxData ) ;
				},
				failure: function(form, action) {
					msgbox.close() ;
					var msg = 'Erreur' ;
					if( action.response.responseText ) {
						msg = Ext.JSON.decode(action.response.responseText).error ;
					}
					Ext.Msg.alert('Erreur',msg) ;
				},
				scope: this
			});
		}
	},
	onAfterUpload: function( recordData ) {
		var formPanelCnt = this.down('#pNorth'),
			formPanel = formPanelCnt.down('form'),
			form = formPanel.getForm() ;
		form.reset() ;
		formPanelCnt.collapse() ;
			  
		this.store.add(recordData) ;
	},
	
	
	getValue: function() {
		var data = [] ;
		this.store.each(function(gridrecord) {
			data.push( gridrecord.getData() ) ;
		}) ;
		return data ;
	}
	
}) ;
