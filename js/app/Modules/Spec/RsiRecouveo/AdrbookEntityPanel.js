Ext.define('RsiRecouveoAdrbookTmpModel',{
	extend: 'RsiRecouveoAdrbookModel',
	idProperty: 'id',
	fields: [
		{name: 'is_new', type:'boolean'},
		{name: 'is_deleted', type:'boolean'}
	]
});

Ext.define('Optima5.Modules.Spec.RsiRecouveo.AdrbookEntityTypePanel',{
	extend:'Ext.panel.Panel',
	
	newTitle: 'Saisie nouveau',
	fieldLabel: 'textfield',
	fieldXtype: 'textfield',
	filterAdrType: '',
	
	store: null,
	
	height: 250,
	border: false,
	
	initComponent: function() {
		this.store = Ext.create('Ext.data.Store',{
			model: 'RsiRecouveoAdrbookTmpModel',
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
				region: 'north',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 8,
				flex: 1,
				title: this.newTitle,
				collapsible: true,
				collapsed: true,
				xtype: 'form',
				layout: 'anchor',
				items: [{
					anchor: '100%',
					labelWidth: 80,
					fieldLabel: this.fieldLabel,
					xtype: this.fieldXtype,
					name: 'adr_txt_new'
				}],
				tools:[{
					type:'save',
					tooltip: 'Enregistrer',
					handler: function(event, toolEl, panelHeader) {
						var formPanel = panelHeader.ownerCt ;
						console.dir(formPanel) ;
						this.handleSave() ;
					},
					scope: this
				}]
			},{
				region: 'center',
				flex: 1,
				xtype: 'grid',
				store: this.store,
				columns: [{
					text: 'Valid?',
					width: 50,
					renderer: function(value, metaData, record) {
						if( record.get('adr_entity_group') ) {
							metaData.tdAttr='style="width:0px; display:none ;"' ;
							return ;
						}
						if( record.get('status_is_invalid') ) {
							metaData.tdCls += ' op5-spec-dbstracy-kpi-nok' ;
						} else if( record.get('status_is_confirm') ) {
							metaData.tdCls += ' op5-spec-dbstracy-kpi-ok' ;
						} else {
							metaData.tdCls += ' op5-spec-dbstracy-kpi-unknown' ;
						}
					}
				},{
					text: this.fieldLabel,
					dataIndex: 'adr_txt',
					flex: 1,
					menuDisabled: true,
					sortable: false,
					renderer: function(value) {
						return Ext.util.Format.nl2br( Ext.String.htmlEncode( value ) ) ;
					}
				},{
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
						tooltip: 'Dupliquer',
						handler: function(grid, rowIndex, colIndex, item, e) {
							var rec = grid.getStore().getAt(rowIndex);
							this.handleCopy(rec) ;
						},
						scope: this,
						disabledCls: 'x-item-invisible',
						isDisabled: function(view,rowIndex,colIndex,item,record ) {
							if( record.get('is_new') ) {
								return true ;
							}
							return false ;
						}
					},{
						icon: 'images/op5img/ico_arrow-double_16.png',
						//tooltip: 'Paramètres',
						handler: function(grid, rowIndex, colIndex, item, e) {
							var rec = grid.getStore().getAt(rowIndex);
							this.handleStatusMenu(rec,e) ;
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
				}]
			}]
		});
		this.callParent() ;
	},
	handleStatusMenu: function(gridrecord,clickevent) {
		var treeContextMenuItems = new Array() ;
		treeContextMenuItems.push({
			iconCls: 'op5-spec-dbstracy-kpi-unknown',
			text: 'Effacer validation',
			handler : function() {
				gridrecord.set({
					status_is_confirm:false,
					status_is_invalid:false
				});
			},
			scope : this
		});
		treeContextMenuItems.push({
			iconCls: 'op5-spec-dbstracy-kpi-ok',
			text: 'Valider contact OK',
			handler : function() {
				gridrecord.set({
					status_is_confirm:true,
					status_is_invalid:false
				});
			},
			scope : this
		});
		treeContextMenuItems.push({
			iconCls: 'op5-spec-dbstracy-kpi-nok',
			text: 'Valider contact OK',
			handler : function() {
				gridrecord.set({
					status_is_confirm:false,
					status_is_invalid:true
				});
			},
			scope : this
		});
		
		var treeContextMenu = Ext.create('Ext.menu.Menu',{
			items : treeContextMenuItems,
			listeners: {
				hide: function(menu) {
					Ext.defer(function(){menu.destroy();},10) ;
				}
			}
		}) ;
		
		treeContextMenu.showAt(clickevent.getXY());
	},
	handleDelete: function(gridrecord) {
		gridrecord.set('is_deleted',true) ;
	},
	handleCopy: function(gridrecord) {
		gridrecord.set('status_is_invalid',true) ;
		
		var formPanel = this.down('form'),
			form = formPanel.getForm() ;
		form.reset() ;
		form.setValues({adr_txt_new:gridrecord.get('adr_txt')}) ;
		formPanel.expand() ;
	},
	handleSave: function() {
		var formPanel = this.down('form'),
			form = formPanel.getForm(),
			formValues = form.getValues(),
			adrTxt = formValues.adr_txt_new ;
		if( Ext.isEmpty(adrTxt) ) {
			return ;
		}
		
		var rec = {
			is_new: true,
			adr_type: this.filterAdrType,
			adr_txt: adrTxt
		} ;
		this.store.add(rec) ;
		form.reset() ;
		formPanel.collapse() ;
	}
}) ;
Ext.define('Optima5.Modules.Spec.RsiRecouveo.AdrbookEntityPanel',{
	extend:'Ext.form.Panel',
	
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusBumpPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusCallPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailOutPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ActionPlusNextPanel'
	],
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
			width: 1100,
			cls: 'ux-noframe-bg',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 10,
			layout: 'anchor',
			defaults: {
				labelWidth: 120,
				anchor: '50%'
			},
			items: [{
				xtype: 'checkboxfield',
				name: 'adrbook_entity_new',
				boxLabel: 'Nouveau contact ?',
				listeners: {
					change: function(field,value) {
						this.doChangeNew(value) ;
					},
					scope: this
				}
			},{
				xtype: 'textfield',
				name: 'adrbook_entity_txt',
				fieldLabel: 'Nom du contact'
			},{
				xtype: 'combobox',
				name: 'adrbook_entity_select',
				fieldLabel: 'Nom du contact',
				forceSelection: true,
				editable: false,
				store: {
					fields: ['adr_entity'],
					data : [],
					sorters: [{
						property: 'adr_entity',
						direction: 'ASC'
					}]
				},
				queryMode: 'local',
				displayField: 'adr_entity',
				valueField: 'adr_entity',
				listeners: {
					select: function(cmb,newValue) {
						this.doSelectEntity(newValue) ;
					},
					scope: this
				}
			},{
				xtype: 'container',
				anchor: '100%',
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				defaults: {
					margin: '0px 6px'
				},
				items: [{
					flex: 4,
					xtype: 'fieldset',
					title: 'Adresses postales',
					items: Ext.create('Optima5.Modules.Spec.RsiRecouveo.AdrbookEntityTypePanel',{
						itemId: 'fsPostal',
						filterAdrType: 'POSTAL',
						newTitle: 'Nouvelle adresse',
						fieldLabel: 'Adresse',
						fieldXtype: 'textarea'
					})
				},{
					flex: 3,
					xtype: 'fieldset',
					title: 'Téléphone / Mobile',
					items: Ext.create('Optima5.Modules.Spec.RsiRecouveo.AdrbookEntityTypePanel',{
						itemId: 'fsTel',
						filterAdrType: 'TEL',
						newTitle: 'Saisie n° téléphone',
						fieldLabel: 'Téléphone',
						fieldXtype: 'textfield'
					})
				},{
					flex: 3,
					xtype: 'fieldset',
					title: 'E-mail',
					items: Ext.create('Optima5.Modules.Spec.RsiRecouveo.AdrbookEntityTypePanel',{
						itemId: 'fsEmail',
						filterAdrType: 'EMAIL',
						newTitle: 'Saisie Email',
						fieldLabel: 'Email',
						fieldXtype: 'textfield'
					})
				}]
			}]
		}) ;
		this.callParent() ;
		this.on('afterrender', function() {
			this.loadAccount( this._accId, (this._adrbookEntityNew ? null : this._adrbookEntity) ) ;
		},this) ;
	},
	doFormLayout: function() {
		var form = this.getForm(),
			formValues = form.getValues(false,false,false,true) ;
		form.findField('adrbook_entity_txt').setVisible(formValues.adrbook_entity_new) ;
		form.findField('adrbook_entity_select').setVisible(!formValues.adrbook_entity_new) ;
	},
	
	
	loadAccount: function( accId, adrbookEntity ) {
		this._accId = accId ;
		this._adrbookEntity = adrbookEntity ;
		this._adrbookEntityNew = !adrbookEntity ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'account_open',
				acc_id: accId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				
				var accountRecord = Ext.ux.dams.ModelManager.create( 
						Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAccountModel(),
						ajaxResponse.data
					),
					fileRecord = accountRecord.files().getById(this._fileFilerecordId) ;

				this.onLoadAccount(accountRecord) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoadAccount: function( accountRecord ) {
		this._accountRecord = accountRecord ;
		
		var arr_accountEntity = [], accountEntity, dataEntity=[] ;
		accountRecord.adrbook().each( function( accAdrRec ) {
			accountEntity = accAdrRec.get('adr_entity') ;
			if( !Ext.Array.contains(arr_accountEntity,accountEntity) ) {
				arr_accountEntity.push(accountEntity) ;
				dataEntity.push({
					adr_entity: accountEntity
				}) ;
			}
		});
		
		var form = this.getForm() ;
		form.reset() ;
		form.findField('adrbook_entity_select').getStore().loadData(dataEntity) ;
		
		this.doChangeNew(this._adrbookEntityNew) ;
		if( this._adrbookEntityNew ) {
			form.setValues({
				adrbook_entity_new: true,
				adrbook_entity_txt: '',
				adrbook_entity_select: null
			}) ;
		} else if( this._adrbookEntity ) {
			form.setValues({
				adrbook_entity_new: false,
				adrbook_entity_txt: '',
				adrbook_entity_select: this._adrbookEntity
			}) ;
			this.doSelectEntity(this._adrbookEntity) ;
		}
	},
	
	doChangeNew: function( isNew ) {
		var form = this.getForm() ;
		form.findField('adrbook_entity_txt').setVisible(isNew) ;
		form.findField('adrbook_entity_select').setVisible(!isNew) ;
		form.findField('adrbook_entity_select').setValue(null) ;
		this.doSelectEntity(null) ;
	},
	doSelectEntity: function( adrbookEntity ) {
		// lookup + fill grids
		Ext.Array.each( this.query('fieldset'), function( formFs ) {
			var childPanel = formFs.down('[filterAdrType]'),
				filterAdrType = childPanel.filterAdrType,
				gridStore = childPanel.store,
				gridData = [] ;
			childPanel.down('form').getForm().reset();
			childPanel.down('form').collapse() ;
			if( !adrbookEntity ) {
				gridStore.removeAll() ;
				return ;
			}
			this._accountRecord.adrbook().each( function(accAdrRec) {
				if( accAdrRec.get('adr_type') == filterAdrType ) {
					gridData.push(accAdrRec.getData()) ;
				}
			}) ;
			gridStore.loadData(gridData) ;
		},this) ;
	},
	
	doSave: function() {
		var formPanel = this,
			form = formPanel.getForm(),
			formValues = form.getValues(false,false,false,true) ;
			adrEntity = ( formValues['adrbook_entity_new'] ? formValues['adrbook_entity_txt'] : formValues['adrbook_entity_select'] ) ;
		if( Ext.isEmpty(adrEntity) ) {
			return ;
		}
		
		var adrbookStore = this._accountRecord.adrbook() ;
		Ext.Array.each( this.query('fieldset'), function( formFs ) {
			var childPanel = formFs.down('[filterAdrType]'),
				filterAdrType = childPanel.filterAdrType,
				gridStore = childPanel.store ;
			gridStore.each( function(gridRecord) {
				var adrbookRecordData = {} ;
				Ext.apply(adrbookRecordData,gridRecord.getData()) ;
				Ext.apply(adrbookRecordData,{adr_entity: adrEntity}) ;
				
				if( adrbookRecordData['adrbook_filerecord_id'] > 0 ) {
					var toupdateRecord = adrbookStore.getById(adrbookRecordData['adrbook_filerecord_id']) ;
					if( adrbookRecordData['is_deleted'] ) {
						adrbookStore.remove(toupdateRecord) ;
					} else {
						toupdateRecord.set(adrbookRecordData) ;
					}
				} else {
					adrbookStore.add(adrbookRecordData) ;
				}
			}) ;
		},this) ;
		
		var adrbookStoreData = [] ;
		adrbookStore.each( function(adrbookRecord) {
			adrbookStoreData.push(adrbookRecord.getData()) ;
		});
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'account_setAdrbook',
				acc_id: this._accId,
				data: Ext.JSON.encode(adrbookStoreData)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				this.fireEvent('saved') ;
				this.destroy() ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},
	
	askDestroy: function() {
		Ext.MessageBox.confirm('Confirmation','Abandonner les modifications ?',function(btn) {
			if( btn=='yes' ) {
				this.destroy() ;
			}
		},this) ;
	},
	askSave: function() {
		Ext.MessageBox.confirm('Confirmation','Sauvegarder fiche contact ?',function(btn) {
			if( btn=='yes' ) {
				this.doSave() ;
			}
		},this) ;
	}
});
