Ext.define('Optima5.Modules.Spec.RsiRecouveo.CfgPanel',{
	extend:'Ext.panel.Panel',

	initComponent: function() {
		Ext.apply(this,{
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [{
				flex: 1,
				itemId: 'tpAttributes',
				xtype: 'treepanel',
				title: 'Variables',
				useArrows: true,
				rootVisible: false,
				store: {
					fields: ['nodeId','nodeText'],
					root: {root:true},
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					}
				},
				columns: [{
					xtype: 'treecolumn',
					dataIndex: 'nodeId',
					text: 'Code',
					width: 110
				},{
					dataIndex: 'nodeText',
					text: 'Valeur',
					width: 200
				}]
			},{
				flex: 2,
				itemId: 'tpScenarios',
				xtype: 'treepanel',
				title: 'Scénarios',
				useArrows: true,
				rootVisible: false,
				store: {
					fields: ['nodeId','nodeText','val1','val2','val3'],
					root: {root:true},
					proxy: {
						type: 'memory',
						reader: {
							type: 'json'
						}
					}
				},
				columns: [{
					xtype: 'treecolumn',
					dataIndex: 'nodeId',
					text: 'Code',
					width: 200
				},{
					dataIndex: 'nodeText',
					text: 'Valeur',
					width: 100
				},{
					dataIndex: 'val1',
					text: '< 1000 k€',
					width: 70,
					align: 'center',
					renderer: function(v){if(v) return '<b>'+v+'</b>';}
				},{
					dataIndex: 'val2',
					text: '< 5000 k€',
					width: 70,
					align: 'center',
					renderer: function(v){if(v) return '<b>'+v+'</b>';}
				},{
					dataIndex: 'val3',
					text: '> 5000 k€',
					width: 70,
					align: 'center',
					renderer: function(v){if(v) return '<b>'+v+'</b>';}
				}]
			}]
		});
		
		this.callParent() ;
		this.setAttributes() ;
		this.setScenarios() ;
	},
	
	setAttributes: function() {
		var rootChildren = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function( atrId ) {
			var atrChildren = [] ;
			Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrData(atrId), function( atrRow ) {
				atrChildren.push( {
					leaf: true,
					nodeId: '<b>'+atrRow.id+'</b>',
					nodeText: atrRow.text
				}) ;
			}) ;
			rootChildren.push({
				children: atrChildren,
				expanded: true,
				nodeId: '<b>'+atrId+'</b>',
				nodeText: Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(atrId).atr_txt
			}) ;
		}) ;
		
		
		this.down('#tpAttributes').getStore().setRootNode({root:true, expanded: true, children: rootChildren}) ;
	},
	setScenarios: function() {
		var root = {
			expanded: true,
			children: [{
				nodeId: '<b>1 - Prise de contact</b>',
				expanded: true,
				children: [{
					nodeId: 'Appel 1',
					nodeText: 'J',
					val1: 'X',
					val2: 'X',
					val3: '',
					leaf: true
				},{
					nodeId: 'Appel 2',
					nodeText: 'J+2',
					val1: 'X',
					val2: 'X',
					val3: 'X',
					leaf: true
				},{
					nodeId: 'Appel 3',
					nodeText: 'J+5',
					val1: 'X',
					val2: 'X',
					val3: 'X',
					leaf: true
				}]
			},{
				nodeId: '<b>2 - Relances amiable</b>',
				expanded: true,
				children: [{
					nodeId: 'Promesse ?',
					nodeText: '<i>action</i>',
					val1: '-',
					val2: '-',
					val3: '-',
					leaf: true
				},{
					nodeId: 'Appel 1',
					nodeText: 'J',
					val1: 'X',
					val2: 'X',
					val3: 'X',
					leaf: true
				},{
					nodeId: 'Relance 2',
					nodeText: 'J+5',
					val1: '',
					val2: 'X',
					val3: 'X',
					leaf: true
				},{
					nodeId: 'Relance 3',
					nodeText: 'J+10',
					val1: '',
					val2: '',
					val3: 'X',
					leaf: true
				}]
			},{
				nodeId: '<b>3 - Outils juridiques</b>',
				expanded: true,
				children: [{
					nodeId: 'Courrier Avocat',
					nodeText: 'J',
					val1: '',
					val2: 'X',
					val3: 'X',
					leaf: true
				},{
					nodeId: 'Procédure huissier',
					nodeText: 'J+7',
					val1: '',
					val2: '',
					val3: 'X',
					leaf: true
				}]
			}]
		} ;
		
		this.down('#tpScenarios').getStore().setRootNode(root) ;
	}
	
});
