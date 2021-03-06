Ext.define('Optima5.Modules.CrmBase.QueryWhereFormBible' ,{
	extend: 'Optima5.Modules.CrmBase.QueryWhereForm',
			  
	requires: [
		'Optima5.Modules.CrmBase.QueryWhereForm',
		'Optima5.Modules.CrmBase.BibleTreePicker',
		'Optima5.Modules.CrmBase.BiblePicker'
	] ,
			  
	bibleId: '',
			  
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 75
			},
			layout: 'anchor',
			items:[{
				xtype: 'fieldset',
				title: 'Filter Bible Mode',
				defaultType: 'textfield',
				defaults: {
					anchor: '100%'
				},
				layout: 'anchor',
				items: [{
					xtype: 'combobox',
					name: 'condition_bible_mode',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['mode','lib'],
						data : [
							{mode:'SINGLE', lib:'Unique/Last record'},
							{mode:'SELECT', lib:'Bible Treenode/entry'}
						]
					},
					queryMode: 'local',
					displayField: 'lib',
					valueField: 'mode'
				}]
			},{
				xtype: 'fieldset',
				hidden: true,
				hiddenMid: 'SELECT' ,
				title: 'Fieldset 2',
				defaultType: 'textfield',
				defaults: {anchor: '100%'},
				layout: 'anchor',
				items: [{
					xtype: 'op5crmbasebibletreepicker',
					selectMode: 'multi',
					optimaModule: me.optimaModule,
					name:'condition_bible_treenodes',
					bibleId:me.bibleId
				}, {
					xtype: 'op5crmbasebiblepicker',
					selectMode: 'multi',
					optimaModule: me.optimaModule,
					name:'condition_bible_entries',
					bibleId:me.bibleId
				}]
			}]
		});
		
		this.callParent() ;
	},
	calcLayout: function(){
		var me = this ;
		
		var curSelect = me.getValues()['condition_bible_mode'] ;
		
		Ext.Array.each( me.query('>fieldset') , function(f){
			if( typeof f.hiddenMid !== 'undefined' ) {
				f.setVisible( curSelect == f.hiddenMid ) ;
			}
		},me) ;
	}
});
