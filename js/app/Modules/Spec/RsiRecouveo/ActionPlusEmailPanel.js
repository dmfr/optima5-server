Ext.define('Optima5.Modules.RsiRecouveo.EmailOutDestField',{
	extend: 'Ext.form.FieldContainer',
	
	mixins: [
		'Ext.form.field.Base'
	],

	_comboboxData: null,
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			layout: {
				type: 'hbox',
				align: 'center'
			},
			items: [{
				itemId: 'cmbAdd',
				xtype: 'combobox',
				fieldLabel: 'Destinataire',
				width: 300,
				forceSelection: false,
				editable: true,
				queryMode: 'local',
				displayField: 'mail',
				valueField: 'mail',
				store: {
					data: this._comboboxData,
					fields: [{name:'nom', type:'string'}, {name: 'mail', type: 'string'}],

				},
				matchFieldWidth: false,
				listConfig: {
					width: 250,
					getInnerTpl: function(displayField) {
						return '<div style="padding-bottom:6px"><div>{nom}</div><div style="text:10px">Mail&#160;:&#160;{mail}</div></div>' ;
					}
				}
			},{
				itemId: 'btnAdd',
				xtype: 'button',
				iconCls: 'op5-spec-rsiveo-emailheadertags-btn',
				margin: {
					left: 4,
					right: 8
				},
				handler: function() {
					this.handleAdd() ;
				},
				scope: this
			},{
				itemId: 'dvTags',
				xtype: 'dataview',
				cls: 'op5-spec-rsiveo-emailheadertags-field',
				tpl: [
					'<tpl for=".">',
						'<div class="op5-spec-rsiveo-emailheadertags">',
							'<div class="op5-spec-rsiveo-emailheadertags-icodelete">',
							'</div>',
							'<div class="op5-spec-rsiveo-emailheadertags-text">',
							'{tag}',
							'</div>',
						'</div>',
					'</tpl>'
				],
				itemSelector: 'div.op5-spec-rsiveo-emailheadertags',
				store: {
					data: [],
					fields: [{name:'mail', type:'string'}],

				},
				prepareData: function(data) {
					return data;
				},
				listeners: {
					itemclick: function(dv, record, item, index, e, eOpts) {
						if( e.getTarget('div.op5-spec-rsiveo-emailheadertags-icodelete') ) {
							this.deleteTag(record) ;
						}
					},
					scope: this
					
				}
			}]
		}) ;
		me.mixins.field.constructor.call(me);
		
		me.callParent() ;
	},
	getStore: function() {
		return this.down('#dvTags').getStore() ;
	},
	getRawValue: function() {
		var values = [] ;
		this.getStore().each( function(rec) {
			values.push(rec.get('tag')) ;
		}) ;
		return Ext.JSON.encode(values) ;
	},
	getValue: function() {
		var values = [] ;
		this.getStore().each( function(rec) {
			values.push(rec.get('tag')) ;
		}) ;
		return values ;
	},
	setRawValue: function(jsonValues) {
		if( Ext.isEmpty(jsonValues) ) {
			this.getStore().removeAll() ;
		}
		var values = Ext.JSON.decode( jsonValues ),
			data = [] ;
		Ext.Array.each( values, function(tag) {
			data.push({tag:tag}) ;
		}) ;
		this.getStore().loadData(data) ;
	},
	setValue: function(values) {
		if( Ext.isEmpty(values) ) {
			this.getStore().removeAll() ;
		}
		var data = [] ;
		Ext.Array.each( values, function(tag) {
			data.push({tag:tag}) ;
		}) ;
		this.getStore().loadData(data) ;
	},
	handleAdd: function() {
		var cmbAdd = this.down('#cmbAdd'),
			dvTags = this.down('#dvTags') ; 
		if( Ext.isEmpty(cmbAdd.getValue()) ) {
			return ;
		}

		var test = dvTags.getStore().findExact('tag',cmbAdd.getValue(),0);

		if (test == -1){
			dvTags.getStore().insert(0,{
			tag: cmbAdd.getValue().trim()
			});
			cmbAdd.reset() ;			
		}




	},
	deleteTag: function(tagRecord) {
		this.down('#dvTags').getStore().remove(tagRecord) ;
	}
});



Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusEmailPanel',{
	extend:'Ext.form.Panel',
	requires: ['Optima5.Modules.Spec.RsiRecouveo.EmailAttachmentsFieldPanel'],
	_fileRecord: null,

	
	initComponent: function() {
/*
		var lstMail = Ext.create('Ext.data.Store', {
			alias: 'store.mailListe',
			model: 'RsiRecouveoComboModel',
			data: [],
			autoload: true
		});
*/
		//	var voila = this._accountRecord.get('adrbook').get('adr_entity');
		var tableau = [];
		this._accountRecord.adrbook().each( function( adrbook ) {
			adrbook.adrbookentries().each( function(adrbookentries) {

				if (adrbookentries.get('adr_type') == 'EMAIL' && adrbookentries.get('status_is_invalid') == false){

					tableau.push({"nom": adrbook.get('adr_entity'), "mail": adrbookentries.get('adr_txt')});
					//emails.add({'nom': adrbook.get('adr_entity'), 'email' : adrbookentries.get('adr_txt')});
					
				}
				
			},this) ;
		},this) ;

		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 0,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{	
				xtype: 'fieldset',
				title: 'Type d\'action',
				layout: {
					type: 'hbox',
					align: 'begin'
				},
				defaults: {
					anchor: '100%',
					labelWidth: 80
				},
				items: [{
					flex: 1,
					xtype: 'displayfield',
					fieldLabel: 'Action',
					value: '<b>Email sortant</b>'
				}]
			},{

				xtype: 'container',
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				items: [{
					xtype: 'fieldset',
					itemId: 'fsAdrMail',
					title: 'Email',
					flex: 1,
					layout: {
						type: 'vbox',
						align: 'stretch'
					},
					items: [

					Ext.create('Optima5.Modules.RsiRecouveo.EmailOutDestField', {
						_comboboxData: tableau
					
					}),

					Ext.create('Optima5.Modules.RsiRecouveo.EmailOutDestField', {
						_comboboxData: tableau
					
					}),{
						xtype: 'textfield',
						fieldLabel: 'Objet'
					}]
				
				},{
					xtype: 'box',
					width: 16
				},	{
					xtype: 'container',
					flex: 1,
					layout: {
						type: 'anchor'
					},
					defaults: {
						anchor: '100%'
					},
					items: [
					{
						xtype: 'fieldset',
						hidden: true,
						itemId: 'fsMailFieldsCnt',
						padding: 10,
						title: 'Paramètres additionnels',
						layout: {
							type: 'anchor'
						},
						defaults: {
							anchor: '100%',
							labelWidth: 80
						},
						items: []
					}]
				}]
			},{
				xtype: 'htmleditor',
				enableColors: true,
				enableAlignements: true
				
			},{
				xtype: 'fieldset',
				padding: 6,
				title: 'Pièces jointes',
				layout: 'fit',
				items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.EmailAttachmentsFieldPanel',{
					name: 'attachments',
					optimaModule: this.optimaModule
				})]
			}
			]
		}) ;
		
		this.callParent() ;
	},
	
	onTplChange: function(tplRecord) {
		var jsonFields = tplRecord.get('input_fields_json'),
			fields = Ext.JSON.decode(jsonFields,true),
			fsMailFieldsCnt = this.down('#fsMailFieldsCnt'),
			fsFields = [] ;
		fsMailFieldsCnt.removeAll() ;
		if( !Ext.isArray(fields) || fields.length==0 ) {
			fsMailFieldsCnt.setVisible(false) ;
			return ;
		}
		fsMailFieldsCnt.setVisible(true) ;
		Ext.Array.each( fields, function(fieldDefinition) {
			fsFields.push(fieldDefinition) ;
		}) ;
		fsMailFieldsCnt.add(fsFields) ;
	}
}) ;
