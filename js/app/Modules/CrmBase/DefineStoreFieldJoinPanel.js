Ext.define('DefineJoinTreeModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'alt_file_code',  type: 'string'},
		{name: 'file_field_code',   type: 'string'},
		{name: 'field_type',   type: 'string'},
		{name: 'text',   type: 'string'}
	]
});
Ext.define('DefineJoinMapModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'target_file_field_code',  type: 'string'},
		{name: 'target_field_type',  type: 'string'},
		{name: 'target_text',  type: 'string'},
		{name: 'local_alt_file_code',   type: 'string'},
		{name: 'local_file_field_code',   type: 'string'},
		{name: 'local_text',  type: 'string'}
	]
});

Ext.define('Optima5.Modules.CrmBase.DefineStoreFieldJoinPanel' ,{
	extend: 'Ext.panel.Panel',
	
	defineStorePanel: null,
	elementtabIdx: null,
	
	getElementtab: function() {
		return this.defineStorePanel.query('tabpanel')[0].child('#elementtab') ;
	},
	getElementtabRecord: function() {
		return this.getElementtab().getStore().getAt(this.elementtabIdx) ;
	},
	
	initComponent: function() {
		var me = this ;
		
		if( (me.defineStorePanel) instanceof Optima5.Modules.CrmBase.DefineStorePanel ) {} else {
			Optima5.Helper.logError('CrmBase:DefineStoreFieldJoinPanel','No DefineStorePanel reference ?') ;
		}
		me.on('destroy',function(thisview) {
			delete thisview.defineStorePanel ;
		},me) ;
		
		if( me.getElementtabRecord()===null ) {
			Optima5.Helper.logError('CrmBase:DefineStoreFieldJoinPanel','No elementtab record index ?') ;
		}
		
		Ext.apply(me,{
			layout:{
				type:'hbox',
				align:'stretch'
			},
			items:[{
				xtype:'treepanel',
				title: 'Local file',
				displayField: 'text',
				flex: 1,
				border: false,
				useArrows: true,
				rootVisible: false,
				store: {
					model: 'DefineJoinTreeModel',
					root: {
						root:true,
						children:[]
					}
				},
				viewConfig: {
					plugins: {
						ptype: 'treeviewdragdrop',
						enableDrag: true,
						enableDrop: false,
						ddGroup: 'TreeToGrid'+me.getId()
					}
				}
			},{
				xtype:'panel',
				title: 'Join target',
				flex: 2,
				border: false,
				layout: {
					type:'vbox',
					align:'stretch'
				},
				items: [{
					xtype:'form',
					border: false,
					frame:false,
					bodyPadding: 10,
					flex:1,
					bodyCls: 'ux-noframe-bg',
					defaults: {
						//anchor: '100%'
					},
					layout: 'anchor',
					fieldDefaults: {
						labelAlign: 'left',
						labelSeparator: '',
						labelWidth: 75
					},
					items:[{
						xtype:'textfield',
						name:'group_name',
						fieldLabel:'Target file',
						anchor:'100%',
					},{
						xtype:'textfield',
						name:'group_name_2',
						fieldLabel:'Target field',
						anchor:'100%',
					}]
				},{
					xtype:'grid',
					border: true,
					flex: 2,
					hidden: true,
					columns: {
						defaults: {
							sortable: false,
							draggable: false,
							menuDisabled: true,
							flex:1,
							maintainFlex:true
						},
						items: [{
							text: 'Target from',
							dataIndex:'target_text'
						},{
							text: 'Join To',
							dataIndex:'local_text'
						}]
					},
					viewConfig: {
						plugins: {
							ptype: 'gridviewdragdrop',
							enableDrag: false,
							enableDrop: true,
							ddGroup: 'TreeToGrid'+me.getId()
						},
						listeners:{
							beforedrop:function(node, data, dropRecord, dropPosition, dropHandlers){
								var srcTreeRecord = data.records[0] ;
								var destMapRecord = dropRecord ;
								if( srcNodeGroup == null || destNodeUser == null ) {
									return false ;
								}
								if( false ) {
									dropHandlers.wait=true
									// do something
									return true ;
								}
								return false ;
							},
							scope:me
						}
					}
				}]
			}]
		});
		
		this.callParent() ;
		
		
	},
	
	initLocalTree: function() {
		/*
		 * Init Treepanel's Store
		 * - if parent<>NULL : AJAX parent fields 
		 * - get locally defined fields from parent grid
		 */
		
	},
	
	initTargetFiles: function() {
		/*
		 * Init Target File combo 
		 * - AJAX for "primary key" files
		 */
		
	},
	
}) ;