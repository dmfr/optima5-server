Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportCanvasPanel',{
	extend: 'Ext.panel.Panel',
	
	requires: ['Optima5.Modules.Spec.RsiRecouveo.ReportCfgAxesPanel'],
	
	alias: 'widget.op5specrsiveoreportcanvas',
	
	initComponent: function() {
		Ext.apply(this,{
			layout: {
				type: 'border'
			},
			items: [{
				region: 'west',
				collapsible: true,
				collapsed: true,
				width: 300,
				xtype: 'treepanel',
				title: 'Données disponibles',
				rootVisible: false,
				useArrows: true,
				store: {
					root: {
					expanded: true,
					children: [
							{ text: 'Analyse financiere', expanded: true, children: [
								{ text: 'DSO (méthode comptable)', leaf: true },
								{ text: 'DSO (par épuisement)', leaf: true},
								{ text: 'Chiffre d\'affaire', leaf: true},
								{ text: 'En-cours client', leaf: true},
								{ text: 'Montant recouvré', leaf: true}
							] },
							{ text: 'Compteurs', expanded: true, children: [
								{ text: 'Nb appels', leaf: true },
								{ text: 'Nb courriers', leaf: true},
								{ text: 'Nb actions manuelles', leaf: true},
								{ text: 'Nb factures ouvertes', leaf: true},
								{ text: 'Nb comptes ouverts', leaf: true},
								{ text: 'Nb dossiers ouverts', leaf: true},
								{ text: 'Nb nouveaux dossiers', leaf: true},
							] },
							{ text: 'Anomalies', expanded: true, children: [
								{ text: 'Retards ? actions', leaf: true },
								{ text: 'Dossiers sans suite ?', leaf: true}
							] }
					]
				}
				}
			},Ext.create('Optima5.Modules.Spec.RsiRecouveo.ReportCfgAxesPanel',{
				region: 'east',
				title: 'Paramétrage',
				collapsible: true,
				collapsed: false,
				animCollapse: false,
				width: 300,
				
				optimaModule: this.optimaModule
			}),{
				style: 'border-left: 3px solid gray',
				region: 'center',
				xtype: 'panel',
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				items: [{
					flex:2,
					xtype: 'cartesian',
					width: '100%',
					height: 500,
					legend: {
						docked: 'right'
					},
					store: {
				fields: ['month', 'data1', 'data2', 'data3', 'data4' ],
					data: [
						{ month: 'Jan', data1: 20, data2: 37, data3: 35, data4: 4 },
						{ month: 'Feb', data1: 20, data2: 37, data3: 36, data4: 5 },
						{ month: 'Mar', data1: 19, data2: 36, data3: 37, data4: 4 },
						{ month: 'Apr', data1: 18, data2: 36, data3: 38, data4: 5 },
						{ month: 'May', data1: 18, data2: 35, data3: 39, data4: 4 },
						{ month: 'Jun', data1: 17, data2: 34, data3: 42, data4: 4 },
						{ month: 'Jul', data1: 16, data2: 34, data3: 43, data4: 4 },
						{ month: 'Aug', data1: 16, data2: 33, data3: 44, data4: 4 },
						{ month: 'Sep', data1: 16, data2: 32, data3: 44, data4: 4 },
						{ month: 'Oct', data1: 16, data2: 32, data3: 45, data4: 4 },
						{ month: 'Nov', data1: 15, data2: 31, data3: 46, data4: 4 },
						{ month: 'Dec', data1: 15, data2: 31, data3: 47, data4: 4 }
					]
					},
					insetPadding: 40,
					axes: [{
						type: 'numeric',
						fields: ['data1', 'data2', 'data3', 'data4' ],
						position: 'left',
						grid: true,
						minimum: 0,
						renderer: function (v) {
							return v.toFixed(v < 10 ? 1: 0) + 'k€';
						}
					}, {
						type: 'category',
						fields: 'month',
						position: 'bottom',
						grid: true,
						label: {
							rotate: {
									degrees: -45
							}
						}
					}],
					series: [{
						type: 'line',
						axis: 'left',
						title: 'DSO',
						xField: 'month',
						yField: 'data1',
						marker: {
							type: 'square'
						},
						highlightCfg: {
							scaling: 2
						},
						tooltip: {
							trackMouse: true,
							style: 'background: #fff',
							renderer: function(storeItem, item) {
									var title = item.series.getTitle();
									this.setHtml(title + ' for ' + storeItem.get('month') + ': ' + storeItem.get(item.series.getYField()) + 'k€');
							}
						}
					}, {
						type: 'line',
						axis: 'left',
						title: 'Encours',
						xField: 'month',
						yField: 'data2',
						marker: {
							type: 'triangle'
						},
						highlightCfg: {
							scaling: 2
						},
						tooltip: {
							trackMouse: true,
							style: 'background: #fff',
							renderer: function(storeItem, item) {
									var title = item.series.getTitle();
									this.setHtml(title + ' for ' + storeItem.get('month') + ': ' + storeItem.get(item.series.getYField()) + 'k€');
							}
						}
					}, {
						type: 'line',
						axis: 'left',
						title: 'CA',
						xField: 'month',
						yField: 'data3',
						marker: {
							type: 'arrow'
						},
						highlightCfg: {
							scaling: 2
						},
						tooltip: {
							trackMouse: true,
							style: 'background: #fff',
							renderer: function(storeItem, item) {
									var title = item.series.getTitle();
									this.setHtml(title + ' for ' + storeItem.get('month') + ': ' + storeItem.get(item.series.getYField()) + 'k€');
							}
						}
					}, {
						type: 'line',
						axis: 'left',
						title: 'Retard',
						xField: 'month',
						yField: 'data4',
						marker: {
							type: 'cross'
						},
						highlightCfg: {
							scaling: 2
						},
						tooltip: {
							trackMouse: true,
							style: 'background: #fff',
							renderer: function(storeItem, item) {
									var title = item.series.getTitle();
									this.setHtml(title + ' for ' + storeItem.get('month') + ': ' + storeItem.get(item.series.getYField()) + 'j');
							}
						}
				}]
				},{
					flex:1,
					xtype: 'form',
					layout: 'hbox',
					bodyCls: 'ux-noframe-bg',
					items: [{
						xtype: 'panel',
						bodyCls: 'ux-noframe-bg',
						padding: 15,
						flex:1,
						layout: 'anchor',
						items: [{
							xtype: 'fieldset',
							title: 'Echelle de temps',
							items: [{
								xtype: 'combobox',
								name: 'group_date_type',
								fieldLabel: 'Intervalle',
								forceSelection: true,
								editable: false,
								store: {
									fields: ['mode','lib'],
									data : [
										{mode:'DAY', lib:'Day (Y-m-d)'},
										{mode:'WEEK', lib:'Week (Y-week)'},
										{mode:'MONTH', lib:'Month (Y-m)'},
										{mode:'YEAR', lib:'Year (Y)'}
									]
								},
								queryMode: 'local',
								displayField: 'lib',
								valueField: 'mode'
							},{
								xtype: 'datefield',
								fieldLabel: 'Date début',
								format: 'Y-m-d'
							},{
								xtype: 'datefield',
								fieldLabel: 'Date fin',
								format: 'Y-m-d'
							}]
						}]
					},{
						xtype: 'panel',
						bodyCls: 'ux-noframe-bg',
						padding: 15,
						flex:1,
						layout: 'anchor',
						items: [{
							xtype: 'fieldset',
							title: 'Filtre(s)',
							items: [{
								xtype: 'combobox',
								name: 'group_date_type',
								fieldLabel: 'Critère',
								forceSelection: true,
								editable: false,
								store: {
									fields: ['mode','lib'],
									data : [
										{mode: 'ko', lib: 'Attribut'}
									]
								},
								queryMode: 'local',
								displayField: 'lib',
								valueField: 'mode'
							}]
						},{
							xtype: 'fieldset',
							title: 'Rupture(s)',
							items: [{
								xtype: 'combobox',
								name: 'group_date_type',
								fieldLabel: 'Critère',
								forceSelection: true,
								editable: false,
								store: {
									fields: ['mode','lib'],
									data : [
										{mode: 'ko', lib: 'Chargé de recouvrement...'}
									]
								},
								queryMode: 'local',
								displayField: 'lib',
								valueField: 'mode'
							}]
						}]
					}]
					
				}]
			}]
		});
		
		
		
		this.callParent() ;
	}
	
}) ;


Ext.define('Optima5.Modules.Spec.RsiRecouveo.ReportsPanel',{
	extend: 'Ext.tab.Panel',
	
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.ReportUsersPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ReportCashPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ReportTilesPanel'
	],
	
	initComponent: function() {
		Ext.apply(this,{
			//layout: 'border',
			plugins:[{ 
				ptype: 'AddTabButton', 
				iconCls: 'icon-add', 
				toolTip: 'New empty chart',
				panelConfig: {
					xtype: 'op5specrsiveoreportcanvas',
					title: 'Nouveau rapport',
					closable: true,
					optimaModule: this.optimaModule
				}
			}],
			items: []
		});
		
		
		this.callParent() ;
		
		/*
		var exemples = ['Directeur général','Directeur finance','Credit manager','Chargé recouvrement'] ;
		Ext.Array.each( exemples, function(titre) {
			var cntPanels = this.down('#cntPanels') ;
			cntPanels.add({
				xtype: 'op5specrsiveoreportcanvas',
				title: titre,
				closable: false
			});
		},this);
		*/
		this.add(Ext.create('Optima5.Modules.Spec.RsiRecouveo.FilesPanel',{
			optimaModule: this.optimaModule,
			_reportMode: true,
			
			title: 'Top Encours',
		}));
		this.add(Ext.create('Optima5.Modules.Spec.RsiRecouveo.ReportUsersPanel',{
			optimaModule: this.optimaModule,
			title: 'Collaborateurs'
		}));
		this.add(Ext.create('Optima5.Modules.Spec.RsiRecouveo.ReportCashPanel',{
			optimaModule: this.optimaModule,
			title: 'Encaissements'
		}));
		this.add(Ext.create('Optima5.Modules.Spec.RsiRecouveo.ReportTilesPanel',{
			optimaModule: this.optimaModule,
			title: 'Tuiles'
		}));
		this.setActiveTab(0) ;
	}
	
});
