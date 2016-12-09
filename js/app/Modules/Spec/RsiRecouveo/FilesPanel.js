Ext.define('Optima5.Modules.Spec.RsiRecouveo.FilesPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Ext.ux.CheckColumnNull',
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',
		'Optima5.Modules.Spec.RsiRecouveo.CfgParamFilter'
	],
	
	viewMode: null,
	autoRefreshDelay: (10*60*1000),
	
	initComponent: function() {
		Ext.apply(this, {
			layout: 'border',
			tbar:[{
				hidden: this._readonlyMode,
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Back</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},'-',Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',{
				cfgParam_id: 'ATR_BU',
				icon: 'images/op5img/ico_blocs_small.gif',
				itemId: 'btnBu',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							this.onAtrSet() ;
						},
						scope: this
					},
					ready: {
						fn: function() {
							
						},
						scope: this
					}
				}
			}),'-',Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',{
				cfgParam_id: 'ATR_DIV',
				icon: 'images/op5img/ico_blocs_small.gif',
				itemId: 'btnDiv',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							this.onAtrSet() ;
						},
						scope: this
					},
					ready: {
						fn: function() {
							
						},
						scope: this
					}
				}
			}),'-',Ext.create('Optima5.Modules.Spec.RsiRecouveo.CfgParamButton',{
				cfgParam_id: 'ATR_SECT',
				icon: 'images/op5img/ico_blocs_small.gif',
				itemId: 'btnSect',
				optimaModule: this.optimaModule,
				listeners: {
					change: {
						fn: function() {
							this.onAtrSet() ;
						},
						scope: this
					},
					ready: {
						fn: function() {
							
						},
						scope: this
					}
				}
			}),'->',{
				itemId: 'tbCreate',
				icon: 'images/op5img/ico_new_16.gif',
				text:'Actions...',
				menu: {
					defaults: {
						scope:this
					},
					items: [{
						text: 'Action groupée',
						icon: 'images/op5img/ico_new_16.gif',
						handler: function() {
							this.handleNewOrder() ;
						},
						scope: this
					},{
						text: 'Mailing ponctuel',
						iconCls: 'op5-spec-dbstracy-grid-view-ordergroup',
						handler: function() {
							this.handleNewHat() ;
						},
						scope: this
					},{
						text: 'Transport',
						icon: 'images/op5img/ico_new_16.gif',
						handler: function() {
							this.handleNewTrspt() ;
						},
						scope: this
					}]
				}
			},{
				hidden: this._readonlyMode,
				iconCls: 'op5-crmbase-datatoolbar-file-export-excel',
				text: 'Export',
				handler: function() {
					this.handleDownload() ;
				},
				scope: this
			}],
			items: [{
				title: 'Statistiques sur sélection',
				region: 'north',
				//hidden: true,
				collapsible: true,
				height: 240,
				border: true,
				xtype: 'panel',
				itemId: 'pNorth',
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				items: []
			},{
				region: 'center',
				flex: 1,
				border: false,
				xtype: 'panel',
				itemId: 'pCenter',
				layout: {
					type: 'fit'
				},
				items: []
			}]
		});
		this.callParent() ;
		this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		this.on('beforedeactivate', function() {
			// HACK !!!
			return ;
			if( this.down('gridpanel').getStore().loading || this.down('gridpanel').getView().isRefreshing ) {
				return false ;
			}
		},this) ;
		
		this.tmpModelCnt = 0 ;
		
		//this.onViewSet(this.defaultViewMode) ;
		this.configureViews() ;
	},
	onCrmeventBroadcast: function(crmEvent, eventParams) {
		switch( crmEvent ) {
			case 'datachange' :
				this.onDataChange() ;
				break ;
			default: break ;
		}
	},
	onDataChange: function() {
		this.doLoad() ;
	},
	
	configureViews: function() {
		var pNorth = this.down('#pNorth') ;
		pNorth.add({
			xtype: 'panel',
			cls: 'chart-no-border',
			width: 350,
			layout: 'fit',
			border: false,
			items: {
				xtype: 'polar',
				border: false,
				store: { 
					fields: ['os', 'data1' ],
					data: [
						{ os: '<b>Recouvré</b>', data1: 68.3 },
						{ os: '<u>Irrecouvrable</u>', data1: 1.7 },
						{ os: 'Prise de contact', data1: 17.9 },
						{ os: 'Relances amiable', data1: 10.2 },
						{ os: 'Outils juridiques', data1: 1.9 }
					]
				},
				insetPadding: { top: 10, left: 10, right: 10, bottom: 20 },
				//innerPadding: 20,
				legend: {
					docked: 'left',
					border: false,
					toggleable: false,
					style: {
						border: {
							color: 'white'
						}
					}
				},
				interactions: ['itemhighlight'],
            sprites: [{
					type: 'text',
					text: 'Répartition (321,580.00 k€)',
					fontSize: 12,
					width: 100,
					height: 30,
					x: 30, // the sprite x position
					y: 205  // the sprite y position
				}],
				series: [{
					type: 'pie',
					angleField: 'data1',
					donut: 50,
					label: {
						field: 'os',
						calloutLine: {
							color: 'rgba(0,0,0,0)' // Transparent to hide callout line
						},
						renderer: function(val) {
							return ''; // Empty label to hide text
						}
					},
					highlight: true,
					tooltip: {
						trackMouse: true,
						style: 'background: #fff',
						renderer: function(storeItem, item) {
							this.setHtml(storeItem.get('os') + ': ' + storeItem.get('data1') + '%');
						}
					}
				}]
			}
		}) ;
		pNorth.add({
			xtype: 'panel',
			width: 215,
			layout: 'fit',
			border: false,
			items: {
				xtype: 'polar',
				border: false,
				store: { 
					fields: ['os', 'data1' ],
					data: [
						{ os: '<b>Recouvré</b>', data1: 68.3 },
						{ os: '<u>Irrecouvrable</u>', data1: 1.7 },
						{ os: 'Prise de contact', data1: 17.9 },
						{ os: 'Relances amiable', data1: 10.2 },
						{ os: 'Outils juridiques', data1: 1.9 }
					]
				},
				insetPadding: { top: 10, left: 10, right: 10, bottom: 20 },
				//innerPadding: 20,
				interactions: ['itemhighlight'],
            sprites: [{
					type: 'text',
					text: 'Nb Dossiers (950)',
					fontSize: 12,
					width: 100,
					height: 30,
					x: 55, // the sprite x position
					y: 205  // the sprite y position
				}],
				series: [{
					type: 'pie',
					angleField: 'data1',
					donut: 50,
					label: {
						field: 'os',
						calloutLine: {
							color: 'rgba(0,0,0,0)' // Transparent to hide callout line
						},
						renderer: function(val) {
							return ''; // Empty label to hide text
						}
					},
					highlight: true,
					tooltip: {
						trackMouse: true,
						style: 'background: #fff',
						renderer: function(storeItem, item) {
							this.setHtml(storeItem.get('os') + ': ' + storeItem.get('data1') + '');
						}
					}
				}]
			}
		}) ;
		pNorth.add({
			xtype: 'panel',
			border: false,
			cls: 'chart-no-border',
			flex: 1,
			layout: 'fit',
			//border: false,
			items: {
            xtype: 'cartesian',
				border: false,
            width: '100%',
            height: '100%',
            legend: {
                docked: 'bottom'
            },
            store: {
					fields: ['month', 'data1', 'data2', 'data3', 'data4', 'other'],
					data: [
						{ month: 'Contacts', data1: 20, data2: 37, data3: 35, data4: 4, other: 4 },
						{ month: 'RDV', data1: 20, data2: 37, data3: 35, data4: 4, other: 4 },
						{ month: 'Promesses', data1: 20, data2: 37, data3: 35, data4: 4, other: 4 },
					]
				},
            insetPadding: { top: 30, left: 10, right: 30, bottom: 10 },
            flipXY: true,
            sprites: [{
                type: 'text',
                text: 'Agenda / Actions imminentes',
                fontSize: 14,
                width: 100,
                height: 30,
                x: 150, // the sprite x position
                y: 20  // the sprite y position
            }],
            axes: [{
                type: 'numeric',
                position: 'bottom',
                adjustByMajorUnit: true,
                fields: 'data1',
                grid: true,
                renderer: function (v) { return v + ''; },
                minimum: 0
            }, {
                type: 'category',
                position: 'left',
                fields: 'month',
                grid: true
            }],
            series: [{
                type: 'bar',
                axis: 'bottom',
                title: [ 'Retard', 'Jour J', 'Jour J+1', '< J+5' ],
                xField: 'month',
                yField: [ 'data1', 'data2', 'data3', 'data4' ],
                stacked: true,
                style: {
                    opacity: 0.80
                },
                highlight: {
                    fillStyle: 'yellow'
                },
                tooltip: {
                    trackMouse: true,
                    style: 'background: #fff',
                    renderer: function(storeItem, item) {
                        var browser = item.series.getTitle()[Ext.Array.indexOf(item.series.getYField(), item.field)];
                        this.setHtml(browser + ' for ' + storeItem.get('month') + ': ' + storeItem.get(item.field) + '%');
                    }
                }
            }]
			}
		}) ;
		
		var atrRenderer = function(value, metaData, record, rowIndex, colIndex, store, view) {
			var column = view.ownerCt.columns[colIndex] ;
			console.log(column.rendererDataindex) ;
		}
		var atrColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
			var atrRecord = Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId) ;
			//console.dir(atrRecord) ;
			atrColumns.push({
				text: atrRecord.atr_txt,
				dataIndex: atrRecord.bible_code,
				rendererDataindex: atrRecord.bible_code + '_text',
				width:90,
				align: 'center',
				renderer: atrRenderer
			}) ;
		}) ;
		
		
		
		var pCenter = this.down('#pCenter') ;
		var columns = [{
			text: 'Attributs',
			columns: atrColumns
		},{
			text: 'Acheteurs',
			columns: [{
				text: 'ID',
				dataIndex: 'id_ref',
				tdCls: 'op5-spec-dbstracy-bigcolumn',
				width:100,
				align: 'center',
				filter: {
					type: 'op5crmbasebible',
					optimaModule: this.optimaModule,
					bibleId: 'BASE_CLI'
				}
			},{
				text: 'Acheteur',
				dataIndex: 'id_txt',
				width:150,
				align: 'center',
				filter: {
					type: 'string'
				}
			}]
		},{
			text: 'Statut',
			align: 'center',
			dataIndex: 'status',
			filter: {
				type: 'op5crmbasebibletree',
				optimaModule: this.optimaModule,
				bibleId: 'CFG_STATUS'
			},
			renderer: function(v,metaData,r) {
				v = r.get('status_txt') ;
				metaData.style += 'color: white ; background: '+r.get('status_color') ;
				return v ;
			}
		},{
			text: 'Next action',
			columns: [{
				text: 'RDV/Action',
				dataIndex: 'next_action'
			},{
				text: 'Date/Echeance',
				dataIndex: 'next_date',
				filter: {
					type: 'date'
				}
			}]
		},{
			text: 'Finance',
			columns: [{
				text: 'Nb Fact',
				dataIndex: 'inv_nb',
				width:90,
				align: 'center'
			},{
				text: 'Montant<br>débiteur',
				dataIndex: 'inv_amount_due',
				width:90,
				align: 'center',
				filter: {
					type: 'number'
				}
			},{
				text: 'Montant<br>total',
				dataIndex: 'inv_amount_total',
				width:90,
				align: 'center',
				filter: {
					type: 'number'
				}
			}]
		}] ;
		pCenter.add({
			xtype: 'grid',
			itemId: 'pGrid',
			columns: columns,
			plugins: [{
				ptype: 'uxgridfilters'
			}],
			store: {
				model: 'RsiRecouveoFileModel',
				data: this.getSampleData()
			},
			listeners: {
				itemdblclick: function(){
					this.handleOpenFile() ;
				},
				scope :this
			}
		});
		
		this.doLoad() ;
	},
	
	onAtrSet: function() {
		this.doLoad(true) ;
	},
	
	doLoad: function(doClearFilters) {
		var objAtrFilter = {} ;
		Ext.Array.each( this.query('toolbar > [cfgParam_id]'), function(cfgParamBtn) {
			console.dir(cfgParamBtn) ;
			objAtrFilter[cfgParamBtn.cfgParam_id] = cfgParamBtn.getValue()
		}) ;
		console.dir(objAtrFilter) ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'file_getRecords',
				filter_atr: Ext.JSON.encode(objAtrFilter)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoad(ajaxResponse.data, doClearFilters) ;
				// Setup autoRefresh task
				//this.autoRefreshTask.delay( this.autoRefreshDelay ) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoad: function(ajaxData, doClearFilters) {
		if( doClearFilters ) {
			this.down('#pCenter').down('#pGrid').getStore().clearFilter() ;
			this.down('#pCenter').down('#pGrid').filters.clearFilters() ;
		}
		this.down('#pCenter').down('#pGrid').getStore().loadRawData(ajaxData) ;
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
	
	doQuit: function() {
		this.destroy() ;
	},
	onDestroy: function() {
		if( this.autoRefreshTask ) {
			this.autoRefreshTask.cancel() ;
		}
	},
	
	handleOpenFile: function() {
		this.optimaModule.postCrmEvent('openfile',{}) ;
	},
	
	getSampleData: function() {
		var data = [{
			filerecord_id: 1,
			atr_bu: 'PMI / PME',
			atr_div: 'Sols',
			atr_sect: 'Secteur 3',
			id_ref: '1234567890',
			id_txt: 'Plastibert',
			status_txt: 'Prise contact',
			status_color: '#A61120',
			next_action: '<font color="black">2ème appel</font>',
			next_date: '15/11/2016',
			inv_nb: '<b>1</b>',
			inv_amount_due: '<b>580.00</b>&nbsp;&euro;',
			inv_amount_total: '<b>580.00</b>&nbsp;&euro;'
		},{
			filerecord_id: 2,
			atr_bu: 'Large industries',
			atr_div: 'Peintures',
			atr_sect: 'Secteur 1',
			id_ref: '9876543210',
			id_txt: 'Solvay SA (SOLB.BE)',
			status_txt: 'Outils juridiques',
			status_color: '#FFD13E',
			next_action: '<font color="red">RDV Tel huissier</font>',
			next_date: '16/11/2016 <font color="red"><b>9h30</b></font>',
			inv_nb: '<b>3</b>',
			inv_amount_due: '<b>2890.49</b>&nbsp;&euro;',
			inv_amount_total: '<b>3600.59</b>&nbsp;&euro;'
		}] ;
		return data ;
	}
});
