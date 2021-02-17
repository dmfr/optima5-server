Ext.define('Optima5.Modules.Spec.RsiRecouveo.FileDetailSubRiskPanel', {
	extend: 'Ext.panel.Panel',
	requires: ['Optima5.Modules.Spec.RsiRecouveo.FileDetailSubRiskXmlBox'],
	_token: null,
	_safeNo: null,
	
	_onVisibleActive: false,
	
	_viewMode: null,
	_searchViewMode:null,
	_resultViewMode:null,
	
	
	_ajaxDataResult: null,
	
	
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
					icon: 'images/op5img/ico_save_16.gif',
					text: 'Save',
					handler: function() {
						this.handleXmlSave() ;
					},
					scope: this
				},{
					itemId: 'btnMode',
					_selectedItemId: null,
					viewConfig: {forceFit: true},
					menu: {
						defaults: {
							handler:function(menuitem) {
								menuitem.up().ownerCmp._selectedItemId = menuitem.itemId ;
								this.setupResultMode() ;
							},
							scope:this
						},
						items: [{
							itemId: 'elements',
							text: 'Elements',
							iconCls: 'op5-spec-rsiveo-grid-view-facture'
						},{
							itemId: 'xml',
							text: 'XML',
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
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'risk_loadResult',
				acc_id: this._accId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success==false || ajaxResponse.data == null ) {
					this._viewMode = 'search' ;
					this.applyView() ;
					return ;
				}
				this.onXmlDownload(ajaxResponse.data.risk_register_id, ajaxResponse.data) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
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
		if( !this._ajaxDataResult ) {
			this._viewMode = 'search' ;
			this.applyView() ;
			return ;
		}
		
		var tbResultBtn = this.down('#tbResult').down('#btnMode') ;
		if( Ext.isEmpty(tbResultBtn._selectedItemId) ) {
			tbResultBtn._selectedItemId = 'elements' ;
		}
		tbResultBtn.menu.items.each( function(menuitem) {
			if( menuitem.itemId == tbResultBtn._selectedItemId ) {
				tbResultBtn.setText( menuitem.text ) ;
				tbResultBtn.setIconCls( menuitem.iconCls ) ;
			}
		});
		
		switch( tbResultBtn._selectedItemId ) {
			case 'xml' :
				return this.setupResultModeXml() ;
			case 'elements' :
				return this.setupResultModeElements() ;
		}
	},
	setupResultModeXml: function() {
		// Tab : XML source component
		var xmlPanel = Ext.create('Optima5.Modules.Spec.RsiRecouveo.FileDetailSubRiskXmlBox',{
			scrollable: true,
			xmlString: this._ajaxDataResult.xml_binary
		}) ;
		
		this.removeAll() ;
		this.add(xmlPanel) ;
	},
	setupResultModeElements: function() {
		var dataObj = this._ajaxDataResult.data_obj ;
		if( !dataObj ) {
			this.removeAll() ;
			return ;
		}
		
		var tableRowsTpl = [
			'<div style="position:relative">',
				'<tpl for="rows">',
					'<tpl if="spacer">',
						'<div style="display: table; height:8px"></div>',
					'<tpl else>',
						'<div style="display: table; width:100% ; margin-bottom:4px">',
							//'{[console.dir(values)]}',
							'<div style="display: table-cell; width:{parent.labelWidth}px"><b>{label}</b></div>',
							'<div style="display: table-cell">',
								'<tpl for="values">', 
									'{.}<br>',
								'</tpl>',
							'</div>',
							'<tpl if="add_invite">',
							'<div style="display: table-cell; width:34px; height:30px; position: relative">',
								'<div class="op5-spec-rsiveo-riskcmp-btn op5-spec-rsiveo-riskcmp-btn-invite" style="position: absolute; right:2px">',
								'</div>',
							'</div>',
							'</tpl>',
						'</div>',
					'</tpl>',
				'</tpl>',
			'</div>'
		] ;
		var directorsRowsTpl = [
			'<div style="position:relative">',
				'<table width="100%" cellpadding="2" cellspacing="2" border="0">',
				'<tpl for="rows">',
					'<tr>',
						//'{[console.dir(values)]}',
						'<td>',
							'<b>{function}</b><br>depuis {[this.formatDate(values.appointmentDate)]}',
						'</td>',
						'<tpl switch="type">',
							'<tpl case="PP">',
								'<td>',
									'{pp_civility}&nbsp;<b>{pp_name}</b>&nbsp;{pp_firstName}',
								'</td>',
								'<td>',
									'né le {[this.formatDate(values.pp_birthDate)]}<br>à {pp_birthPlace}',
								'</td>',
							'<tpl case="PM">',
								'<td>',
									'<b>{pm_name}</b>',
								'</td>',
								'<td>',
									'SIREN : <b>{pm_siren}</b>',
								'</td>',
							'<tpl default>',
								'',
						'</tpl>',
					'</tr>',
				'</tpl>',
				'</table>',
			'</div>',
			{
				formatDate: function(v) {
					return Ext.util.Format.date(Ext.Date.parse(v,'Y-m-d'),'d/m/Y') ;
				}
			}
		] ;
		
		var displayElements = [] ;
		
		var titleIdentity ;
		switch( dataObj.status ) {
			case 'INA' :
				titleIdentity = '<font color="red"><b>'+'Entreprise inactive'+'</b></font>' ;
				break ;
			case 'ACT' :
				titleIdentity = 'Entreprise active' ;
				break ;
			default :
				titleIdentity = '<font color="orange"><b>'+'Statut = '+dataObj.status+'</b></font>' ;
				break ;
		}
		if( dataObj.identity_rows ) {
			displayElements.push({
				xtype: 'fieldset',
				//padding: 4,
				title: titleIdentity,
				items: [{
					xtype: 'component',
					tpl: tableRowsTpl,
					data: {
						labelWidth: 130,
						rows: dataObj.identity_rows
					}
				}]
			}) ;
		}
		
		if( dataObj.characteristics_rows ) {
			
		}
		
		if( dataObj.score_int != null ) {
			displayElements.push({
				xtype: 'fieldset',
				//height: 300,
				title: 'Score',
				layout: {
					type: 'hbox',
					align: 'begin'
				},
				items: [{
					xtype: 'component',
					width: 80,
					tpl: [
						'<div style="padding:8px ; width:80px ; height: 60px">',
							'<div style="border-radius: 10%; background: {score_color}; height:100% ; width:100% ; display:table">',
								'<div style="display:table-cell ; vertical-align: middle; text-align:center">',
									'<div style="color:white ; font-size:32px ; line-height:36px">{score_int}</div>',
								'</div>',
							'</div>',
						'</div>',
						'<tpl if="payrank_int">',
						'<i>Payrank</i>',
						'<div style="padding:8px ; width:64px ; height: 56px">',
							'<div style="border-radius: 10%; background: {payrank_color}; height:100% ; width:100% ; display:table">',
								'<div style="display:table-cell ; vertical-align: middle; text-align:center">',
									'<div style="color:white ; font-size:28px ; line-height:32px">{payrank_int}</div>',
								'</div>',
							'</div>',
						'</div>',
						'</tpl>'
					],
					data: {
						score_int: dataObj.score_int,
						score_color: dataObj.score_color,
						payrank_int: dataObj.payrank_int || null,
						payrank_color: dataObj.payrank_color || null,
					}
				},{
					xtype: 'panel',
					padding: 2,
					flex: 1,
					height: 160,
					layout: 'fit',
					items: [{
						xtype: 'cartesian',
						store: {
							proxy: {type:'memory'},
							fields: [
								{name: 'date_sql', type:'string'},
								{name: 'date_txt', type:'string'},
								{name: 'date_txt_short', type:'string'},
								{name: 'score', type:'number'},
								{name: 'color', type:'string'}
							],
							data: dataObj.score_rows,
							sorters: [{
								property: 'date_sql',
								direction: 'ASC'
							}]
						},
						axes: [{
								type: 'numeric',
								position: 'left',
								adjustByMajorUnit: true,
								grid: true,
								fields: 'score',
								renderer: function (v) {
									var str = '' ;
									if( v ) {
										str+= '' + Math.round(v) ;
									}
									return str ;
								},
								minimum: 0,
								maximum: 10
						},{
								type: 'category',
								position: 'bottom',
								//grid: true,
								fields: 'date_txt_short',
								renderer: function (v) { 
									return v ;
								},
								label: {
									fontFamily: 'sans-serif',
									fontSize: 10,
									/*
									rotate: {
										degrees: -45
									}
									*/
								}
						}],
						series: [{
							type: 'bar',
							axis: 'left',
							title: 'Score',
							xField: 'date_txt_short',
							yField: 'score',
							//stacked: true,
							renderer: function(sprite, config, rendererData, index) {
								var store = rendererData.store,
									record = store.getData().items[index] ;
								return {
									fillStyle: record.get('color')
								};
							},
							style: {
								opacity: 0.80,
								minGapWidth: 10
							},
							highlight: {
								fillStyle: 'yellow'
							},
							tooltip: {
								style: 'background: #fff',
								renderer: function(storeItem, item) {
									var str = '' ;
									str+= 'Score au ' ;
									str+= storeItem.get('date_txt') ;
									str+= ' : ' ;
									str+= '<b>' + storeItem.get('score') + '/10' + '</b>' ;
									this.setHtml(str);
								}
							}
						}]
					}]
				}]
			});
		}
		
		if( dataObj.keyfigures_rows != null ) {
			var colRenderer = function(value, metaData, record, rowIndex, colIndex, store, view) {
				// style the cell using the dataIndex of the column
				//console.dir(view) ;
				var headerCt = view.grid.getHeaderContainer(),
					column = headerCt.getHeaderAtIndex(colIndex);
				if( column.dataIndex=='label' ) {
					return '<b>'+value+'</b>' ;
				}
				if( record.get('label_italic') ) {
					return '<i>'+value+'</i>' ;
				} else {
					return Ext.util.Format.number(value,'0,000') ;
				}
			}
			var fields = [
					{name: 'label', type: 'string'},
					{name: 'label_italic', type: 'boolean'}
				],
				cols = {},
				rows = {} ;
			cols['label'] = {
				text: 'Data',
				dataIndex: 'label',
				width: 130,
				renderer: colRenderer
			};
			Ext.Object.each( dataObj.keyfigures_labels, function(k,v) {
				rows[k] = {label: v, label_italic: (k.slice(-2)=='_i')};
			});
			Ext.Array.each( dataObj.keyfigures_rows, function(r) {
				var dateSql = r.k_date,
					dateKey = 'c_'+dateSql ;
				if( !cols.hasOwnProperty(dateKey) ) {
					cols[dateKey] = {text: dateSql, dataIndex: dateKey, width:150, renderer: colRenderer, align:'center'} ;
					fields.push({name:dateKey,type:'number'}) ;
				}
				Ext.Object.each( r, function(k,v) {
					if( !rows.hasOwnProperty(k) ) {
						return ;
					}
					rows[k][dateKey] = v ;
				}) ;
			});
			displayElements.push({
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
						items: Ext.Object.getValues(cols)
					},
					store: {
						proxy: { type:'memory' },
						fields: fields,
						data: Ext.Object.getValues(rows)
					}
				}]
			});
		}
		
		if( dataObj.directors_rows ) {
			displayElements.push({
				xtype: 'fieldset',
				//padding: 4,
				title: 'Direction',
				items: [{
					xtype: 'component',
					tpl: directorsRowsTpl,
					data: {
						//labelWidth: 130,
						rows: dataObj.directors_rows
					}
				}]
			}) ;
		}
		
		var elementsPanel = {
			title: 'Données',
			scrollable: 'vertical',
			xtype: 'container',
			layout: 'anchor',
			defaults: {
				anchor: '100%'
			},
			items: displayElements
		};
		
		this.removeAll() ;
		this.add(elementsPanel);
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
			xmlItems.push(Ext.create('Optima5.Modules.Spec.RsiRecouveo.FileDetailSubRiskXmlBox',{
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
		
		this._ajaxDataId = null ;
		this._ajaxDataResult = null ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'risk_fetchResult',
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
				this.onXmlDownload(riskRegisterId, ajaxResponse.data) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	handleXmlSave: function() {
		if( !this._ajaxDataId ) {
			return ;
		}
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'risk_saveResult',
				acc_id: this._accId,
				data: Ext.JSON.encode({
					id_register: this._ajaxDataId
				})
			},
			success: function(response) {
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onXmlDownload: function( riskRegisterId, ajaxData ) {
		this._ajaxDataId = riskRegisterId ;
		this._ajaxDataResult = ajaxData ;
		this._viewMode = 'result' ;
		this.applyView() ;
	}
}) ;
