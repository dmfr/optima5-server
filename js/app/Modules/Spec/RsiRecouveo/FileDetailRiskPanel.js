Ext.define('Optima5.Modules.Spec.RsiRecouveo.FileDetailRiskPanel', {
	extend: 'Ext.panel.Panel',
	requires: ['Optima5.Modules.Spec.RsiRecouveo.FileDetailRiskXmlBox'],
	_token: null,
	_safeNo: null,
	
	_onVisibleActive: false,
	
	_viewMode: null,
	_searchViewMode:null,
	_resultViewMode:null,
	
	
	_tmpXmlBuffer: '',
	
	
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
			msg: RsiRecouveoLoadMsg.loadMsg
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},
	
	sendEvent: function(eventname) {
		this.fireEvent(eventname,this) ;
	},

	
	initComponent: function () {
		Ext.apply(this, {
			//scrollable: 'vertical',
			//cls: 'ux-noframe-bg',
			bodyPadding: 8,
			//bodyCls: 'ux-noframe-bg',
			layout: 'fit',
			tbar: [{
				itemId: 'tbViewmode',
				viewConfig: {forceFit: true},
				menu: {
					defaults: {
						handler:function(menuitem) {
							//console.log('ch view '+menuitem.itemId) ;
							this._viewMode = menuitem.itemId ;
							this.applyView() ;
						},
						scope:this
					},
					items: [{
						itemId: 'search',
						text: 'Recherche',
						iconCls: 'op5-spec-rsiveo-grid-view-ordergroup'
					},{
						itemId: 'result',
						text: 'Résultats',
						iconCls: 'op5-spec-rsiveo-grid-view-order'
					}]
				}
			},{
				hidden: true,
				itemId: 'tbSearch',
				flex: 1,
				border: false,
				xtype: 'toolbar',
				items: [{
					width: 120,
					itemId: 'tbSearchMode',
					xtype: 'combobox',
					queryMode: 'local',
					displayField: 'mode_txt',
					valueField: 'mode_code',
					editable: false,
					forceSelection: true,
					store: {
						fields: ['mode_txt','mode_code'],
						data: [
							{mode_code: '_', mode_txt: '- Automatique -'},
							{mode_code: 'ID', mode_txt: 'SIREN/TVA'},
							{mode_code: 'NAME_CITY', mode_txt: 'Société (,Ville)'},
							{mode_code: 'MANAGER', mode_txt: 'Nom (,Prénom)'},
						]
					},
					value: '_',
					listeners: {
						select: function(cmb,rec) {
							var val = rec.get('mode_code'),
								txtField = cmb.up().down('#tbSearchTxt') ;
							txtField.setVisible( val && val!='_' ) ;
						}
					}
				},{
					hidden: true,
					itemId: 'tbSearchTxt',
					flex: 1,
					xtype: 'textfield'
				},{
					itemId: 'tbSearchBtn',
					icon: 'images/modules/rsiveo-search-16.gif',
					handler: function(btn) {
						this.handleSearch() ;
					},
					scope: this
				}]
			},{
				hidden: true,
				itemId: 'tbResult',
				flex: 1,
				border: false,
				xtype: 'toolbar',
				items: ['->',{
					viewConfig: {forceFit: true},
					menu: {
						defaults: {
							handler:function(menuitem) {
								//console.log('ch view '+menuitem.itemId) ;
								//this._viewMode = menuitem.itemId ;
								//this.applyView() ;
							},
							scope:this
						},
						items: [{
							itemId: 'test1',
							text: 'test1',
							iconCls: 'op5-spec-rsiveo-grid-view-facture'
						},{
							itemId: 'test2',
							text: 'test2',
							iconCls: 'op5-spec-rsiveo-grid-view-facture'
						}]
					}
				}]
			}],
			items: [{
				xtype: 'box',
				style: {
					'display': 'table-cell',
					'vertical-align': 'middle',
					'text-align': 'center'
				},
				html: '<i>Aucun résultat associé</i>'
			}]
		});

		this.callParent();
		if( this._parentCmp ) {
			this.optimaModule = this._parentCmp.optimaModule ;
			//this._accId = this._parentCmp._accId ;
			this.mon(this._parentCmp,'doreload',this.onDoReload,this) ;
			this.on('show',this.onVisible,this,{single: true}) ;
		}
	},
	onDoReload: function(parentCmp,accId) {
		//parent has been (re)loaded
		if( !this._onVisibleActive ) {
			this._onVisibleAccId = accId ;
			return ;
		}
		if( accId != this._accId ) {
			this.queryAccount(accId) ;
		}
	},
	onVisible: function() {
		this._onVisibleActive = true ;
		this.queryAccount(this._onVisibleAccId) ;
	},
	
	queryAccount: function(accId) {
		//TODO : TMP
		this._accId = accId ;
		//for test :
		this._viewMode = 'search' ;
		this.applyView() ;
	},
	
	applyView: function() {
		var currentViewMode ;
		Ext.Array.each( this.down('toolbar').query('toolbar'), function(tbar) {
			if( !tbar.isVisible() ) {
				return ;
			}
			switch( tbar.itemId ) {
				case 'tbSearch' : currentViewMode='search' ; break ;
				case 'tbResult' : currentViewMode='result' ; break ;
				default : break ;
			}
			return false ;
		}) ;
		
		// Gestion toolbar
		if( currentViewMode == this._viewMode ) {
			return ;
		}
		
		var switchTbarVisible = '' ;
		switch( this._viewMode ) {
			case 'search' : switchTbarVisible='tbSearch' ; break ;
			case 'result' : switchTbarVisible='tbResult' ; break ;
			default : break ;
		}
		var menuItem = this.down('#tbViewmode').menu.down('#'+this._viewMode) ;
		//console.dir(this.down('#tbViewmode')) ;
		//console.dir(menuItem) ;
		if( menuItem ) {
			//console.dir(menuItem) ;
			this.down('#tbViewmode').setText( menuItem.text ) ;
			this.down('#tbViewmode').setIconCls( menuItem.iconCls ) ;
		}
		Ext.Array.each( this.down('toolbar').query('toolbar'), function(tbar) {
			tbar.setVisible( switchTbarVisible==tbar.itemId ) ;
		}) ;
		
		switch( this._viewMode ) {
			case 'search' : this.setupSearchMode() ; break ;
			case 'result' : this.setupResultMode() ; break ;
			default : break ;
		}
	},
	setupSearchMode: function() {
		this.down('#tbSearch').down('#tbSearchMode').setValue('_') ;
		this.down('#tbSearch').down('#tbSearchTxt').reset() ;
		this.handleSearch() ;
	},
	setupResultMode: function() {
		this.removeAll() ;
		this.add({
			xtype: 'tabpanel',
			items:[Ext.create('Optima5.Modules.Spec.RsiRecouveo.FileDetailRiskXmlBox',{
				title: 'Source',
				xmlString: this._tmpXmlBuffer
			}),{
				title: 'Données',
				scrollable: 'vertical',
				xtype: 'container',
				layout: 'anchor',
				defaults: {
					anchor: '100%'
				},
				items: [{
					xtype: 'fieldset',
					//padding: 4,
					title: 'Identité',
					items: [{
						xtype: 'component',
						tpl: [
							'<div style="position:relative">',
								'<tpl for="rows">',
									'<tpl if="spacer">',
										'<div style="display: table; height:8px"></div>',
									'<tpl else>',
										'<div style="display: table; width:100% ; margin-bottom:4px">',
											'{[console.dir(values)]}','<div style="display: table-cell; width:{parent.labelWidth}px">{label}</div>',
											'<div style="display: table-cell">',
												'<tpl for="values">', 
													'{.}<br>',
												'</tpl>',
											'</div>',
											'<tpl if="add_invite">',
											'<div style="display: table-cell; width:34px; position: relative">',
												'<div class="op5-spec-rsiveo-riskcmp-btn op5-spec-rsiveo-riskcmp-btn-invite" style="position: absolute; right:2px">',
												'</div>',
											'</div>',
											'</tpl>',
										'</div>',
									'</tpl>',
								'</tpl>',
							'</div>'
						],
						data: {
							labelWidth: 100,
							rows: [
								{label: 'Label 1', values: ['Value 1','Value 11'], add_invite: true},
								{label: 'Label 2', values: ['Value 2','Value 22','Value 222']},
								{spacer: true},
								{label: 'Label 4', values: ['Value 444']},
							]
						}
					}]
				},{
					xtype: 'fieldset',
					title: 'Score',
					layout: {
						type: 'hbox',
						align: 'begin'
					},
					items: [{
						xtype: 'component',
						width: 80,
						height: 60,
						tpl: [
							'<div style="padding:8px ; width:100% ; height: 100%">',
								'<div style="border-radius: 10%; background: {color}; height:100% ; width:100% ; display:table">',
									'<div style="display:table-cell ; vertical-align: middle; text-align:center">',
										'<div style="color:white ; font-size:32px ; line-height:36px">{score}</div>',
									'</div>',
								'</div>',
							'</div>'
						],
						data: {
							score: 5,
							color: '#ff0000'
						}
					},{
						xtype: 'component',
						flex: 1,
						height: 200,
						html: '<div style="height:100% ; width:100% ">&nbsp;</div>'
					}]
				},{
					xtype: 'fieldset',
					title: 'Chiffres clés',
					items: [{
						xtype: 'grid',
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
							items: [
								{dataIndex: 'mkey', width:135, text: ''},
								{dataIndex: 'y_2020', width:120, text: '2020'},
								{dataIndex: 'y_2019', width:120, text: '2019'},
							]
						},
						store: {
							proxy: { type:'memory' },
							fields: ['mkey','y_2020','y_2019'],
							data: [
								{mkey: 'C.A.', y_2020: '328 158,65', y_2019: '254 147,96'},
								{mkey: 'Résultat net', y_2020: '328 158,65', y_2019: '254 147,96'},
								{mkey: 'Fonds propres', y_2020: '328 158,65', y_2019: '254 147,96'},
								{mkey: 'Endettement', y_2020: '328 158,65', y_2019: '254 147,96'},
							]
						}
					}]
				}]
			}]
		});
		return ;
		
		this.removeAll() ;
		this.add({
					scrollable: true,
					flex: 1,
					xtype: 'form',
					//bodyCls: 'ux-noframe-bg',
					layout: 'anchor',
					cls: 'op5-spec-rsiveo-risk-displayform',
					fieldDefaults: {
						anchor: "100%",
						labelWidth: 130,
						labelSeparator : " :",
					},
					items: [{
						xtype: 'fieldset',
						title: 'SCORES',
						items: [{
							xtype: 'displayfield',
							fieldLabel: 'Note globale',
							fieldStyle: {
								"font-size": '14px',
								"line-height": '15px'
							},
							value: '&#160;'
						},{
							xtype: 'displayfield',
							fieldLabel: 'Limite',
							value: '&#160;'
						},{
							xtype: 'displayfield',
							fieldLabel: 'Statut',
							value: '&#160;'
						},{
							xtype: 'displayfield',
							fieldLabel: 'DBT Score',
							value: '&#160;'
						},{
							xtype: 'displayfield',
							fieldLabel: 'Privilège(s)',
							value: '&#160;'
						},{
							xtype: 'fieldset',
							title: 'Indicateur d\'exposition',
							items: [{
								xtype: 'displayfield',
								fieldLabel: 'Activité',
								value: '&#160;'
							},{
								xtype: 'displayfield',
								fieldLabel: 'Entreprise',
								value: '&#160;'
							}]
						}]
					},{
						xtype: 'fieldset',
						title: 'TENDANCES',
						items: [{
							xtype: 'box',
							height: 48
						}]
					},{
						xtype: 'fieldset',
						title: 'DIRIGEANTS',
						items: [{
							xtype: 'displayfield',
							fieldLabel: 'Nombre de dirigeants',
							value: '&#160;'
						},{
							xtype: 'displayfield',
							fieldLabel: 'Détail',
							value: '&#160;'
						}]
					},{
						xtype: 'fieldset',
						title: 'MAISON MÈRE ULTIME',
						items: [{
							xtype: 'displayfield',
							fieldLabel: 'Raison sociale',
							value: '&#160;'
						},{
							xtype: 'displayfield',
							labelStyle: "font-weight:normal",
							fieldLabel: 'SAFE number',
							value: '&#160;'
						},{
							xtype: 'displayfield',
							fieldLabel: 'Pays',
							value: '&#160;'
						},{
							xtype: 'displayfield',
							fieldLabel: 'SIREN',
							value: '&#160;'
						}]
					},{
						xtype: 'fieldset',
						title: 'JUGEMENTS & PRIVILÈGES',
						items: [{
							xtype: 'box',
							height: 48
						}]
					},{
						xtype: 'fieldset',
						title: 'COMPORTEMENTS DE PAIEMENT',
						items: [{
							xtype: 'displayfield',
							fieldLabel: 'DBS Score',
							value: '&#160;'
						},{
							xtype: 'displayfield',
							fieldLabel: 'DBS secteur',
							value: '&#160;'
						}]
					}]
			});
	},
	buildWaitPanel: function() {
		this.removeAll() ;
		this.add({
			flex: 1,
			xtype: 'box',
			cls:'op5-waiting'
		});
	},
	buildEmptyPanel: function() {
		this.removeAll() ;
		this.add({
			xtype: 'box',
			style: {
				'display': 'table-cell',
				'vertical-align': 'middle',
				'text-align': 'center'
			},
			html: '<i>Aucun résultat associé</i>'
		});
	},
	
	handleSearch: function(mode,txt) {
		if( !this._accId ) {
			return ;
		}
		
		var mode = this.down('#tbSearch').down('#tbSearchMode').getValue(),
			txt = this.down('#tbSearch').down('#tbSearchTxt').getValue() ;
		if( mode!='_' && Ext.isEmpty(txt) ) {
			this.buildEmptyPanel() ;
			return ;
		}
		
		this.buildWaitPanel() ;
		
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'risk_doSearch',
				acc_id: this._accId,
				data: Ext.JSON.encode({
					search_mode: mode,
					search_txt: txt
				})
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					return ;
				}
				this.onSearch(ajaxResponse.data) ;
			},
			scope: this
		}) ;
	},
	onSearch: function(ajaxData) {
		var xmlItems = [] ;
		Ext.Array.each( ajaxData.arr_xml, function(xml) {
			xmlItems.push({
				xtype: 'box',
				margin: '10px 0px 4px 0px',
				html: xml.type
			});
			xmlItems.push(Ext.create('Optima5.Modules.Spec.RsiRecouveo.FileDetailRiskXmlBox',{
				xmlString: xml.binary
			})) ;
		}) ;
		
		this.removeAll() ;
		this.add({
			xtype: 'tabpanel',
			items: [{
				title: 'Recherche',
				xtype: 'grid',
				viewConfig: {
					enableTextSelection: true
				},
				//itemId: 'gridScenarios',
				columns: [{
					align: 'center',
					xtype:'actioncolumn',
					width:24,
					disabledCls: 'x-item-invisible',
					items: [{
						icon: 'images/op5img/ico_pdf_16.png',
						tooltip: 'Rapport PDF',
						handler: function(grid, rowIndex, colIndex, item, e) {
							var rec = grid.getStore().getAt(rowIndex);
							this.handlePdfDownload(rec.get('id')) ;
						},
						scope: this,
						disabledCls: 'x-item-invisible',
						isDisabled: function(view,rowIndex,colIndex,item,record ) {
							return false ;
						}
					}]
				},{
					align: 'center',
					xtype:'actioncolumn',
					width:24,
					disabledCls: 'x-item-invisible',
					items: [{
						icon: 'images/modules/rsiveo-folder-16.png',
						tooltip: 'Rapport en ligne',
						handler: function(grid, rowIndex, colIndex, item, e) {
							var rec = grid.getStore().getAt(rowIndex);
							this.handleXmlDownload(rec.get('id')) ;
						},
						scope: this,
						disabledCls: 'x-item-invisible',
						isDisabled: function(view,rowIndex,colIndex,item,record ) {
							return false ;
						}
					}]
				},{
					flex: 1,
					text: 'Entités',
					dataIndex: 'id',
					renderer: function(v,metaData,r) {
						var txt = '' ;
						txt += '<b>' + r.get('name') + '</b><br>' ;
						txt += '&nbsp;&nbsp;<b>SIREN</b>:&nbsp;' + r.get('register') + '<br>' ;
						txt += '&nbsp;&nbsp;<b>Adr</b>:&nbsp;' + r.get('adr') + '<br>' ;
						txt += '&nbsp;&nbsp;<b>Activité</b>:&nbsp;' + r.get('activity') + '<br>' ;
						return txt ;
					}
				}],
				store: {
					fields: ['id','register','name','adr','activity'],
					data: ajaxData.rows
				},
				listeners: {
					selectionchange: function(grid,record) {
						//this.setupScenario() ;
					},
					scope: this
				}
			},{
				xtype: 'panel',
				scrollable: 'vertical',
				title: 'XML interface',
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				items: xmlItems
			}]
		});
	},
	
	handlePdfDownload: function(riskRegisterId, forcedl=false) {
		if( !riskRegisterId ) {
			return ;
		}
		this.sendEvent('attachclick') ;
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'risk_fetchPdf',
				acc_id: this._accId,
				confirm: (forcedl ? 'true' : ''),
				data: Ext.JSON.encode({
					id_register: riskRegisterId
				})
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					return ;
				}
				if( ajaxResponse.confirm == true ) {
					Ext.Msg.confirm('Confirmation','Document existant. Mettre à jour ?', function(btn) {
						if( btn=='yes' ) {
							this.handlePdfDownload(riskRegisterId,true) ;
						}
					},this) ;
					return ;
				}
				this.sendEvent('attachsaved') ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
		
	},
	handleXmlDownload: function(riskRegisterId) {
		if( !riskRegisterId ) {
			return ;
		}
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'risk_fetchXml',
				acc_id: this._accId,
				data: Ext.JSON.encode({
					id_register: riskRegisterId
				})
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					return ;
				}
				this.onXmlDownload(ajaxResponse.data) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
		
	},
	onXmlDownload: function( ajaxData ) {
		this._tmpXmlBuffer = ajaxData.xml_binary ;
		this._viewMode = 'result' ;
		this.applyView() ;
	}
}) ;
