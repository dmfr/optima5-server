Ext.define('RsiRecouveoConfigModuleItem',{
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'id',  type:'string'},
		{name: 'title',  type:'string'},
		{name: 'caption',    type:'string'},
		{name: 'iconClsSmall',type:'string'},
		{name: 'iconClsBig',type:'string'},
		{name: 'jsClass', type:'string'}
	]
});

Ext.define('Optima5.Modules.Spec.RsiRecouveo.ConfigPanel', {
	extend: 'Ext.window.Window',
	
	requires: [
		'Optima5.ThumbListModel',
		'Optima5.Modules.Spec.RsiRecouveo.ConfigMetaPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ConfigUsersPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ConfigScenariosPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ConfigPayPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ConfigSocsPanel',
		'Optima5.Modules.Spec.RsiRecouveo.ConfigApiPanel'
	],
	
	menuData: [{
		id:'meta',
		title:'Coordonnées générales',
		caption:'Coordonnées & valeurs fixes',
		iconClsBig:'op5-spec-rsiveo-config-meta-big',
		iconClsSmall:'op5-spec-rsiveo-config-meta-small',
		jsClass:'Optima5.Modules.Spec.RsiRecouveo.ConfigMetaPanel'
	},{
		id:'pay',
		title:'Moyens de paiement',
		caption:'Activation & coordonnées des moyens de paiement',
		iconClsBig:'op5-spec-rsiveo-config-pay-big',
		iconClsSmall:'op5-spec-rsiveo-config-pay-small',
		jsClass:'Optima5.Modules.Spec.RsiRecouveo.ConfigPayPanel'
	},{
		id:'users',
		title:'Chargés de recouverement',
		caption:'Gestion des utilisateurs, périmètres et coordonnées',
		iconClsBig:'op5-spec-rsiveo-config-users-big',
		iconClsSmall:'op5-spec-rsiveo-config-users-small',
		jsClass:'Optima5.Modules.Spec.RsiRecouveo.ConfigUsersPanel'
	},{
		id:'emails',
		title:'Comptes Email',
		caption:'Gestion des boîtes Email automatisées',
		iconClsBig:'op5-spec-rsiveo-config-emails-big',
		iconClsSmall:'op5-spec-rsiveo-config-emails-small',
		jsClass:'Optima5.Modules.Spec.RsiRecouveo.ConfigEmailsPanel'
	},{
		id:'scenarios',
		title:'Scénarios',
		caption:'Gestion des scénarios de recouvrement',
		iconClsBig:'op5-spec-rsiveo-config-scenarios-big',
		iconClsSmall:'op5-spec-rsiveo-config-scenarios-small',
		jsClass:'Optima5.Modules.Spec.RsiRecouveo.ConfigScenariosPanel'
	},{
		id:'socs',
		title:'Entités / Sociétés',
		caption:'Définition des métadonnées liées aux sociétés',
		iconClsBig:'op5-spec-rsiveo-config-socs-big',
		iconClsSmall:'op5-spec-rsiveo-config-socs-small',
		jsClass:'Optima5.Modules.Spec.RsiRecouveo.ConfigSocsPanel'
	},{
		id:'api_gestion',
		title:'Gestion de l\'API',
		caption:'Définition des paramètres de l\'API',
		iconClsBig:'op5-spec-rsiveo-config-keys-big',
		iconClsSmall:'op5-spec-rsiveo-config-keys-small',
		jsClass:'Optima5.Modules.Spec.RsiRecouveo.ConfigApiPanel'
	}],
	
	initComponent: function() {
		var me = this ;
		
		this.menuStore = Ext.create('Ext.data.Store',{
			model:'RsiRecouveoConfigModuleItem',
			data:this.menuData
		}) ;
		
		var thumbListData = [] ;
		this.menuStore.each( function(record) {
			if( !Ext.ClassManager.isCreated( record.get('jsClass') ) ) {
				Ext.require(record.get('jsClass'),null,this) ;
			}
			
			thumbListData.push({
				id:record.getId(),
				title:record.get('title'),
				caption:record.get('caption'),
				iconCls:record.get('iconClsBig')
			}) ;
		},this) ;
		
		Ext.apply(this,{
			layout: 'fit',
			items: [{
				xtype: 'tabpanel',
				activeTab:0,
				layout:'border',
				items :[{
					xtype:'dataview',
					title: 'Admin',
					itemId: 'menu',
					tpl:[
						'<tpl for=".">',
						'<div id="{id}" class="thumb-wrap {iconCls}">',
						'<span class="title">{title}</span><br/>',
						'<span class="caption">{caption}</span>',
						'</div>',
						'</tpl><br/>'
					],
					itemSelector: 'div.thumb-wrap',
					store: {
						model:'Optima5.ThumbListModel',
						data:thumbListData
					},
					emptyText: 'No images available',
					overItemCls: 'x-view-over',
					singleSelect: true,
					listeners:{
						itemclick: function( view, record ) {
							this.openTab( record.getId() ) ;
						},
						scope:this
					}
				}]
			}]
		}) ;
		this.callParent() ;
	},
	getTabPanel: function() {
		return this.down('tabpanel') ;
	},
	
	openTab: function( tabId ) {
		var tab = this.getTabPanel().child('#'+tabId) ;
		
		if( tab == null ) {
			tab = this.createTab(tabId) ;
			if( tab==null ) {
				return ;
			}
		}
		tab.show() ;
	},
	createTab: function( tabId ) {
		var tab,
			record = this.menuStore.getById(tabId) ;
		
		if( record == null ) {
			return null ;
		}
		if( !Ext.ClassManager.isCreated( record.get('jsClass') ) ) {
			//console.log( record.get('jsClass') + ' not defined!' ) ;
			return null ;
		}
		tab = Ext.create(record.get('jsClass'),{
			optimaModule: this.optimaModule,
			itemId: tabId,
			title: record.get('title'),
			iconCls: record.get('iconClsSmall'),
			closable:true
		}) ;
		this.getTabPanel().add(tab) ;
		return tab ;
	}
});
