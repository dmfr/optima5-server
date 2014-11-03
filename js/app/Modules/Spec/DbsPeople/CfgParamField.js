Ext.define('Optima5.Modules.Spec.DbsPeople.CfgParamField',{
	extend:'Ext.form.field.Picker',

	requires: ['Ext.XTemplate'], 

	fieldSubTpl: [
		'<div id="{id}" type="{type}" ',
			'<tpl if="size">size="{size}" </tpl>',
			'<tpl if="tabIdx">tabIndex="{tabIdx}" </tpl>',
			'class="{fieldCls} {typeCls}" autocomplete="off">',
			'<span id="{cmpId}-divicon" class="biblepicker-icon">&#160;</span>',
			'<span id="{cmpId}-divtext" class="biblepicker-text">&#160;</span>',
		'</div>',
		'<div id="{cmpId}-triggerWrap" class="{triggerWrapCls}" role="presentation">',
			'{triggerEl}',
			'<div class="{clearCls}" role="presentation"></div>',
		'</div>',
		{
			compiled: true,
			disableFormats: true
		}
	],
			  
	

	isFormField: true,
	submitValue: true,
	//resizable: true,
	myValue : null ,
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:BibleTreePicker','No module reference ?') ;
		}
		
		this.addEvents('ready') ;
		this.addChildEls('divicon','divtext') ;
		
		this.on('afterrender',this.displayValue,this) ;
		
		this.callParent() ;
		
		this.cfgParamTree = Ext.create('Optima5.Modules.Spec.DbsPeople.CfgParamTree',{
			renderTo: Ext.getBody(),
			floating: true,
			hidden: true,
			focusOnShow: true,
			ownerCt: me.ownerCt,
			pickerField: me,
			
			optimaModule: this.optimaModule,
			cfgParam_id: this.cfgParam_id,
			width:250,
			height:300,
			listeners: {
				change: {
					fn: function(){
						this.onChange() ;
					},
					scope: this
				},
				load: {
					fn: this.onAfterLoad,
					scope: this
				}
			}
		});
	},
	onAfterLoad: function() {
		if( !Optima5.Modules.Spec.DbsPeople.HelperCache.authHelperHasAll() ) {
			this.doAuthCleanup() ;
		}
		this.isReady = true ;
		this.fireEvent('ready',this) ;
	},
	doAuthCleanup: function() {},
	
	expand: function() {
		var me = this ;
		if( !me.isReady ) {
			me.on('ready',function(){
				me.expand();
			},me,{
				single:true
			}) ;
			return ;
		}
		this.callParent() ;
	},
	collapse: function() {
		var me = this ;
		this.callParent() ;
	},
	onItemClick: function( picker, record ) {
		var me = this ;
		var oldValue = me.myValue ;
		me.myValue = record.get('entry_key') ;
		this.fireEvent('change',me,me.myValue,oldValue) ;
		me.applyPrettyValue(record) ;
		me.collapse() ;
	},
			  
	createPicker: function() {
		//console.log('created!!') ;
		var me = this ;
		if( !me.isReady ) {
			return null ;
		}
		return this.cfgParamTree ;
	},
	onChange: function() {
		var cfgParamTree = this.cfgParamTree,
			selectedValue = cfgParamTree.getValue() ;
		this.fireEvent('change',selectedValue,this.oldValue) ;
		this.oldValue = selectedValue ;
		
		this.displayValue() ;
	},
	displayValue: function() {
		var cfgParamTree = this.cfgParamTree,
			selectedValue = cfgParamTree.getValue() ;
		if( selectedValue == null ) {
			this.divicon.removeCls('biblepicker-iconimg-oktree') ;
			this.divicon.addCls('biblepicker-iconimg-nok') ;
			this.divtext.dom.innerHTML = this.cfgParam_emptyDisplayText ;
		} else {
			this.divicon.removeCls('biblepicker-iconimg-nok') ;
			this.divicon.addCls('biblepicker-iconimg-oktree') ;
			this.divtext.dom.innerHTML = cfgParamTree.getStore().getNodeById(selectedValue).get('nodeText') ;
		}
	},
	
	// TODO: accept setRawValue / setValue
	setValue: function() {
		
	},
	setRawValue: function() {
		
	},
		
	getValue: function() {
		var cfgParamTree = this.cfgParamTree ;
		return cfgParamTree.getNode() ;
	},
	getRawValue: function() {
		var cfgParamTree = this.cfgParamTree ;
		return cfgParamTree.getValue() || '' ;
	},
	getLeafNodesKey: function() {
		var cfgParamTree = this.cfgParamTree,
			retValue = cfgParamTree.getLeafNodesKey() ;
		return retValue ;
	},
	getErrors: function( curvalue ) {
		var errors = this.callParent(arguments) ;
		return errors;
	}  
});