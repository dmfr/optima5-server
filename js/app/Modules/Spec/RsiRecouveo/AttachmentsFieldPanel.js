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
							if( !record.get('is_new') ) {
								return true ;
							}
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
							if( record.get('is_new') ) {
								return true ;
							}
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
					text: 'Nb',
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
		
		gridrecord.set('is_deleted',true) ;
	},
	handleView: function(gridrecord) {
		// open EnvelopeViewer on gridrecord tmpId
		gridrecord.set('status_is_invalid',true) ;
		
		var formPanelCnt = this.down('#pNorth'),
			formPanel = formPanelCnt.down('form'),
			form = formPanel.getForm() ;
		form.reset() ;
		form.setValues({adr_txt_new:gridrecord.get('adr_txt')}) ;
		formPanelCnt.expand() ;
	},
	
	handleUpload: function() {
		var formPanelCnt = this.down('#pNorth'),
			formPanel = formPanelCnt.down('form'),
			form = formPanel.getForm() ;
		if(form.isValid()){
			var ajaxParams = me.optimaModule.getConfiguredAjaxParams() ;
			Ext.apply( ajaxParams, {
				_moduleId: 'spec_dbs_tracy',
				_action: 'attachments_uploadfile'
			}) ;
			
			var msgbox = Ext.Msg.wait('Uploading document...');
			form.submit({
				url: Optima5.Helper.getApplication().desktopGetBackendUrl(),
				params: ajaxParams,
				success : function(form,action){
					msgbox.close() ;
					Ext.menu.Manager.hideAll();
					var ajaxData = Ext.JSON.decode(action.response.responseText).data ;
					this.handleNewAttachment( ajaxData.tmp_id ) ;
				},
				failure: function(fp, o) {
					msgbox.close() ;
					msg('Pouet','Error during upload') ;	
				},
				scope: me
			});
		}
		
		var rec = {
			is_new: true,
			adr_type: this.filterAdrType,
			adr_txt: adrTxt
		} ;
		this.store.add(rec) ;
		form.reset() ;
		formPanelCnt.collapse() ;
	},
	onAfterUpload: function( tmpMediaId, recordData ) {
		
	},
	
}) ;
