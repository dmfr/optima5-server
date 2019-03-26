Ext.define('Optima5.Modules.CrmBase.QwindowTokenPanel',{
	extend:'Ext.panel.Panel',
	
	_tokenCfg: null,
	
	initComponent: function() {
		Ext.apply(this,{
			title: 'Token(s) management',
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [{
				tbar: [{
					itemId: 'tbNew',
					icon: 'images/op5img/ico_new_16.gif',
					text: 'New token...',
					handler: function() {
						this.setupToken(0);
					},
					scope: this
				}],
				xtype: 'grid',
				width: 190,
				itemId: 'gridTokens',
				columns: [{
					flex: 1,
					text: 'Tokens',
					dataIndex: 'token_id',
					renderer: function(v,metaData,r) {
						if( r.get('token_is_authbypass') ) {
							metaData.tdCls += ' op5-crmbase-query-token-authbypass' ;
						}
						var txt = '' ;
						txt += '<b>' + r.get('token_key') + '</b><br>' ;
						txt += '&nbsp;&nbsp;' + r.get('token_txt') + '<br>' ;
						return txt ;
					}
				}],
				store: {
					fields: [
						{name: 'token_id', type: 'int'},
						{name: 'token_key', type: 'string'},
						{name: 'token_txt', type: 'string'},
						{name: 'token_is_authbypass', type: 'boolean'}
					],
					data: [],
					sorters: [{
						property: 'token_id',
						direction: 'DESC'
					}],
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					}
				},
				listeners: {
					selectionchange: function(sel,selected) {
						if( selected && selected.length==1 ) {
							this.setupToken( selected[0].get('token_id') ) ;
						}
					},
					scope: this
				}
			},{
				flex: 1,
				itemId: 'pTokenEmpty',
				hidden: false,
				xtype: 'box',
				cls: 'ux-noframe-bg'
			},{
				flex: 1,
				itemId: 'pTokenEditor',
				hidden: true,
				xtype: 'panel',
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				tbar: [{
					icon: 'images/op5img/ico_save_16.gif',
					text: 'Save',
					handler: function() {
						this.doSaveEditor();
					},
					scope: this
				},{
					icon: 'images/op5img/ico_cancel_small.gif',
					text: 'Cancel',
					handler: function() {
						this.doDiscardEditor();
					},
					scope: this
				},'->',{
					itemId: 'tbDelete',
					icon: 'images/op5img/ico_delete_16.gif',
					text: 'Delete',
					handler: function() {
						this.handleDeleteToken();
					},
					scope: this
				}],
				items: [{
					itemId: 'pTokenEditorForm',
					xtype: 'form',
					bodyCls: 'ux-noframe-bg',
					layout: {
						type: 'hbox',
						align: 'stretch'
					},
					fieldDefaults: {
						labelWidth: 65,
						anchor: '100%'
					},
					items: [{
						flex: 2,
						xtype: 'fieldcontainer',
						padding: 16,
						layout: 'anchor',
						items: [{
							xtype: 'textfield',
							anchor: '',
							width: 175,
							fieldLabel: 'Token Key',
							name: 'token_key'
						},{
							xtype: 'hiddenfield',
							name: 'token_id'
						},{
							xtype: 'textfield',
							fieldLabel: 'Description',
							name: 'token_txt'
						}]
					},{
						flex: 1,
						xtype: 'fieldcontainer',
						padding: 16,
						layout: 'anchor',
						items: [{
							xtype: 'checkboxfield',
							boxLabel: 'Bypass Auth',
							name: 'token_is_authbypass'
						}]
					}]
				},{
					flex: 1,
					xtype: 'panel',
					layout: {
						type: 'hbox',
						align: 'stretch'
					},
					items: [{
						flex: 1,
						itemId: 'pTokenEditorQvars',
						title: 'Pre-defined variables',
						xtype: 'damsembeddedgrid',
						store: {
							fields: ['qvar_key','qvar_value'],
							data: [],
							sorters: [{
								property: 'qvar_key',
								direction: 'ASC'
							}],
							proxy: { type: 'memory' }
						},
						columns: {
							defaults: {
								menuDisabled: true,
								draggable: false,
								sortable: false,
								hideable: false,
								resizable: false,
								groupable: false,
								lockable: false
							},
							items: [{
								flex: 1,
								dataIndex: 'qvar_key',
								text: 'Variable',
								editor: {
									xtype: 'textfield'
								}
							},{
								flex: 1,
								dataIndex: 'qvar_value',
								text: 'Value',
								editor: {
									xtype: 'textfield'
								}
							}]
						}
					},{
						flex: 1,
						itemId: 'pTokenEditorMap',
						title: 'Resultset(s) mapping',
						xtype: 'grid',
						store: {
							fields: [
								{name: 'is_target', type: 'boolean'},
								{name: 'tab_id', type: 'int'},
								{name: 'tab_title_src', type: 'string'},
								{name: 'tab_title_target', type: 'string'}
							],
							data: [],
							sorters: [{
								property: 'tab_id',
								direction: 'ASC'
							}],
							proxy: { type: 'memory' }
						},
						plugins: {
							ptype: 'cellediting',
							clicksToEdit: 1
						},
						columns: {
							defaults: {
								menuDisabled: true,
								draggable: false,
								sortable: false,
								hideable: false,
								resizable: false,
								groupable: false,
								lockable: false
							},
							items:[{
								xtype: 'checkcolumn',
								width: 32,
								dataIndex: 'is_target'
							},{
								text: 'Source',
								dataIndex: 'tab_title_src',
								width: 75
							},{
								text: 'Target',
								dataIndex: 'tab_title_target',
								flex:1,
								editor: {
									xtype: 'textfield'
								}
							}]
						}
					}]
				}]
			}]
		}) ;
		this.callParent() ;
		this.doLoad() ;
	},
	evalForm: function() {
		
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
	
	doLoad: function() {
		this.showLoadmask() ;
		var me = this ;
		
		var ajaxParams = this._ajaxParams ;
		Ext.apply( ajaxParams, {
			_subaction: 'token_get'
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				this._tokenCfg = Ext.decode(response.responseText).data ;
				this.onAfterLoad() ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: me
		});
	},
	onAfterLoad: function() {
		var gridTokensData = [] ;
		Ext.Array.each( this._tokenCfg.tokens, function(tokenCfgIter) {
			gridTokensData.push({
				token_id: tokenCfgIter.token_id,
				token_key: tokenCfgIter.token_key,
				token_txt: tokenCfgIter.token_txt,
				token_is_authbypass: tokenCfgIter.token_is_authbypass
			});
		}) ;
		
		this.down('#gridTokens').getStore().loadData(gridTokensData) ;
		this.setupToken(null) ;
	},
	
	setupToken: function(tokenId) {
		var gridTokens = this.down('#gridTokens'),
			pTokenEmpty = this.down('#pTokenEmpty'),
			pTokenEditor = this.down('#pTokenEditor') ;
		if( tokenId == null ) {
			gridTokens.getSelectionModel().setLocked(false) ;
			gridTokens.getSelectionModel().deselectAll() ;
			pTokenEmpty.setVisible(true) ;
			pTokenEditor.setVisible(false) ;
			return ;
		}
		
		var pTokenEditorMapData = this._tokenCfg.tpl_resultset ;
		
		var pTokenEditorForm = pTokenEditor.down('#pTokenEditorForm'),
			pTokenEditorQvars = pTokenEditor.down('#pTokenEditorQvars'),
			pTokenEditorMap = pTokenEditor.down('#pTokenEditorMap') ;
		pTokenEditorForm.reset() ;
		pTokenEditorQvars.getStore().loadData([]) ;
		pTokenEditorMap.getStore().loadData(pTokenEditorMapData) ;
		
		if( tokenId === 0 ) {
			pTokenEditor.down('#tbDelete').setVisible(false);
			function randLetter() {
				var letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
				var letter = letters[Math.floor(Math.random() * letters.length)];
				return letter
			}
			var tokenKey = '' ;
			for( var i=0 ; i<7 ; i++ ) {
				tokenKey += randLetter() ;
			}
			tokenKey = tokenKey.toUpperCase() ;
			
			pTokenEditorForm.getForm().setValues({
				qsql_name: this._tokenCfg.qsql_name,
				token_key: tokenKey
			}) ;
		}
		if( tokenId > 0 ) {
			pTokenEditor.down('#tbDelete').setVisible(true);
			var tokenCfgRow = null ;
			Ext.Array.each( this._tokenCfg.tokens, function(tokenCfgIter) {
				if( tokenCfgIter.token_id == tokenId ) {
					tokenCfgRow = tokenCfgIter ;
					return false ;
				}
			},this) ;
			if( !tokenCfgRow ) {
				return this.setupToken(null) ;
			}
			
			var map_qresultmap = {} ;
			Ext.Array.each( tokenCfgRow.q_resultmap, function(qresultmapRow) {
				map_qresultmap[qresultmapRow.tab_id] = qresultmapRow ;
			}) ;
			Ext.Array.each( pTokenEditorMapData, function(row) {
				if( map_qresultmap.hasOwnProperty(row.tab_id) ) {
					Ext.apply(row,map_qresultmap[row.tab_id]) ;
				}
			}) ;
			
			pTokenEditorForm.getForm().setValues(Ext.apply({
				qsql_name: this._tokenCfg.qsql_name
			},tokenCfgRow)) ;
			pTokenEditorQvars.getStore().loadData( tokenCfgRow.q_vars ) ;
			pTokenEditorMap.getStore().loadData( pTokenEditorMapData ) ;
		}
		gridTokens.getSelectionModel().setLocked(true) ;
		pTokenEmpty.setVisible(false) ;
		pTokenEditor.setVisible(true) ;
	},
	
	
	handleDeleteToken: function() {
		Ext.Msg.confirm('Confirm ?','Delete current token',function(btn){
			if( btn=='yes' ) {
				var doDelete = true ;
				this.doSaveEditor(doDelete) ;
			}
		},this);
	},
	doSaveEditor: function(doDelete=false) {
		var me = this ;
		var pTokenEditor = this.down('#pTokenEditor') ;
		var pTokenEditorForm = pTokenEditor.down('#pTokenEditorForm'),
			pTokenEditorQvars = pTokenEditor.down('#pTokenEditorQvars'),
			pTokenEditorMap = pTokenEditor.down('#pTokenEditorMap') ;
		
		var tokenCfgRowQvars = [] ;
		pTokenEditorQvars.getStore().each( function(rec) {
			tokenCfgRowQvars.push( rec.getData() ) ;
		}) ;
		var tokenCfgRowQresultmap = [] ;
		pTokenEditorMap.getStore().each( function(rec) {
			tokenCfgRowQresultmap.push( rec.getData() ) ;
		}) ;
		var tokenCfgRow = pTokenEditorForm.getForm().getFieldValues() ;
		tokenCfgRow['q_vars'] = tokenCfgRowQvars ;
		tokenCfgRow['q_resultmap'] = tokenCfgRowQresultmap ;
		
		
		this.showLoadmask() ;
		var ajaxParams = Ext.clone(this._ajaxParams) ;
		Ext.apply( ajaxParams, {
			_subaction: 'token_set',
			data: Ext.JSON.encode(tokenCfgRow)
		});
		if( doDelete===true ) {
			Ext.apply( ajaxParams, {
				do_delete: 1
			});
		}
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', Ext.decode(response.responseText).error);
					return ;
				}
				
				this.doLoad() ;
				this.optimaModule.postCrmEvent('toggleautorunquery',{
							qType:me.qType,
							queryId:me.queryId
				}) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: me
		});
	},
	doDiscardEditor: function() {
		this.setupToken(null) ;
	}
}) ;
